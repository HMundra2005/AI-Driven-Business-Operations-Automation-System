import { dbHelper } from '../db/database.js';

/**
 * 9 Controlled Backend Tools for the AI Business Operations Agent.
 * Strict human-in-the-loop: Consequential actions (POs, refunds, commitments)
 * are drafted into the `approvals` table and require explicit owner sign-off.
 */
export const toolRegistry = {
  // 1. Get Inventory Status
  get_inventory_status: {
    name: 'get_inventory_status',
    description: 'Retrieve real-time product inventory records, low-stock alerts, and stock deficits.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'low_stock', 'critical'], description: 'Filter stock level' }
      }
    },
    execute(userId, args = {}) {
      let query = `
        SELECT p.*, s.name as supplier_name 
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.user_id = ?
      `;
      if (args.filter === 'critical') {
        query += ' AND p.current_stock <= (p.min_threshold / 2)';
      } else if (args.filter === 'low_stock') {
        query += ' AND p.current_stock <= p.min_threshold';
      }
      query += ' ORDER BY p.current_stock ASC';

      const products = dbHelper.all(query, [userId]);
      return {
        count: products.length,
        products: products.map(p => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          currentStock: p.current_stock,
          minThreshold: p.min_threshold,
          unit: p.unit,
          unitPrice: p.unit_price,
          supplier: p.supplier_name,
          status: p.current_stock <= Math.floor(p.min_threshold / 2) ? 'Critical' : (p.current_stock <= p.min_threshold ? 'Low Stock' : 'In Stock')
        }))
      };
    }
  },

  // 2. Check Order Stock Feasibility
  check_order_stock_feasibility: {
    name: 'check_order_stock_feasibility',
    description: 'Compare pending customer order requirements with available inventory to identify shortages.',
    parameters: {
      type: 'object',
      properties: {
        order_number: { type: 'string', description: 'e.g. ORD-4491' }
      }
    },
    execute(userId, args = {}) {
      let orderQuery = 'SELECT * FROM orders WHERE user_id = ?';
      const params = [userId];
      if (args.order_number) {
        orderQuery += ' AND order_number = ?';
        params.push(args.order_number.toUpperCase());
      } else {
        orderQuery += " AND status LIKE '%Shortage%' ORDER BY created_at DESC LIMIT 1";
      }

      const order = dbHelper.get(orderQuery, params);
      if (!order) return { message: 'No matching order found.' };

      const items = dbHelper.all(`
        SELECT oi.*, p.name as product_name, p.current_stock, p.unit, p.min_threshold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      const shortages = [];
      for (const itm of items) {
        if (itm.current_stock < itm.quantity) {
          shortages.push({
            product: itm.product_name,
            required: itm.quantity,
            available: itm.current_stock,
            deficit: itm.quantity - itm.current_stock,
            unit: itm.unit
          });
        }
      }

      return {
        orderNumber: order.order_number,
        status: order.status,
        totalAmount: order.total_amount,
        hasShortage: shortages.length > 0,
        shortages,
        recommendation: shortages.length > 0
          ? `Shortage of ${shortages.map(s => `${s.deficit} ${s.unit} of ${s.product}`).join(', ')}. Draft a replenishment PO immediately.`
          : 'All order items are in stock and ready for dispatch.'
      };
    }
  },

  // 3. Create Replenishment Draft (PO)
  create_replenishment_draft: {
    name: 'create_replenishment_draft',
    description: 'Draft a purchase order to restock depleted inventory. Placed into Pending Approvals for owner review.',
    parameters: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: 'Name or partial name of product to restock' },
        quantity: { type: 'number', description: 'Quantity to order' },
        reason: { type: 'string', description: 'Operational reason for replenishment' }
      },
      required: ['product_name']
    },
    execute(userId, args) {
      const product = dbHelper.get(`
        SELECT p.*, s.name as supplier_name, s.id as supplier_id 
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.user_id = ? AND (p.name LIKE ? OR p.sku LIKE ?)
      `, [userId, `%${args.product_name}%`, `%${args.product_name}%`]);

      if (!product) return { error: `Product matching "${args.product_name}" was not found.` };

      const qty = args.quantity || (product.min_threshold * 2 - product.current_stock);
      const estCost = `₹${(qty * product.unit_price).toLocaleString('en-IN')}`;
      const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const approvalId = `appr_${Date.now()}`;

      dbHelper.run(`
        INSERT INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by)
        VALUES (?, ?, 'Purchase Order', ?, ?, ?, 'High', 'Pending', ?, 'AI Assistant')
      `, [
        approvalId,
        userId,
        `${product.supplier_name || 'Vendor'} - Restock ${product.name}`,
        args.reason || `AI draft: Restock ${qty} ${product.unit} to fulfill customer commitments.`,
        estCost,
        poNumber
      ]);

      return {
        success: true,
        approvalId,
        poNumber,
        product: product.name,
        quantity: qty,
        estimatedCost: estCost,
        status: 'Draft placed in Pending Approvals for owner authorization.'
      };
    }
  },

  // 4. Get Pending Approvals
  get_pending_approvals: {
    name: 'get_pending_approvals',
    description: 'Retrieve actions awaiting the business owner\'s decision (POs, credit overrides, complaints).',
    parameters: { type: 'object', properties: {} },
    execute(userId) {
      const approvals = dbHelper.all(`
        SELECT * FROM approvals 
        WHERE user_id = ? AND status = 'Pending'
        ORDER BY CASE urgency WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END
      `, [userId]);

      return {
        count: approvals.length,
        items: approvals.map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          details: a.details,
          amount: a.amount,
          urgency: a.urgency,
          requestedBy: a.requested_by
        }))
      };
    }
  },

  // 5. Execute Approval Action
  execute_approval_action: {
    name: 'execute_approval_action',
    description: 'Execute or reject a pending approval request when the owner instructs you to do so.',
    parameters: {
      type: 'object',
      properties: {
        approval_id: { type: 'string', description: 'The approval ID or PO reference' },
        action: { type: 'string', enum: ['approve', 'reject'], description: 'approve or reject' },
        reason: { type: 'string', description: 'Reason for rejection if applicable' }
      },
      required: ['approval_id', 'action']
    },
    execute(userId, args) {
      const approval = dbHelper.get(`
        SELECT * FROM approvals 
        WHERE user_id = ? AND (id = ? OR reference_id = ? OR title LIKE ?)
      `, [userId, args.approval_id, args.approval_id, `%${args.approval_id}%`]);

      if (!approval) return { error: `No pending approval found matching "${args.approval_id}".` };

      if (args.action === 'approve') {
        dbHelper.run("UPDATE approvals SET status = 'Approved' WHERE id = ?", [approval.id]);
        return { success: true, message: `Successfully authorized: "${approval.title}". Status updated to Approved in database.` };
      } else {
        dbHelper.run("UPDATE approvals SET status = 'Rejected', details = details || ' [Rejected: ' || ? || ']' WHERE id = ?", [args.reason || 'Rejected by owner', approval.id]);
        return { success: true, message: `Rejected: "${approval.title}". Status set to Rejected.` };
      }
    }
  },

  // 6. Search Communications
  search_communications: {
    name: 'search_communications',
    description: 'Retrieve incoming customer and supplier messages, transit updates, complaints, and credit requests.',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword (e.g. delay, rice, refund, credit)' },
        category: { type: 'string', description: 'Filter by category' }
      }
    },
    execute(userId, args = {}) {
      let query = 'SELECT * FROM emails WHERE user_id = ?';
      const params = [userId];

      if (args.keyword) {
        query += ' AND (subject LIKE ? OR body LIKE ? OR sender_name LIKE ?)';
        const kw = `%${args.keyword}%`;
        params.push(kw, kw, kw);
      }
      if (args.category) {
        query += ' AND category = ?';
        params.push(args.category);
      }
      query += ' ORDER BY received_at DESC LIMIT 5';

      const emails = dbHelper.all(query, params);
      return {
        count: emails.length,
        messages: emails.map(e => ({
          id: e.id,
          from: e.sender_name || e.sender,
          subject: e.subject,
          category: e.category,
          urgency: e.urgency,
          requiresApproval: e.requires_approval === 1,
          proposedReply: e.proposed_reply,
          replyStatus: e.reply_status
        }))
      };
    }
  },

  // 7. Draft Email Reply
  draft_email_reply: {
    name: 'draft_email_reply',
    description: 'Draft a contextually appropriate reply to a client or supplier email for owner review.',
    parameters: {
      type: 'object',
      properties: {
        email_id: { type: 'string', description: 'Email ID' },
        reply_text: { type: 'string', description: 'The drafted response message' }
      },
      required: ['email_id', 'reply_text']
    },
    execute(userId, args) {
      const email = dbHelper.get('SELECT * FROM emails WHERE id = ? AND user_id = ?', [args.email_id, userId]);
      if (!email) return { error: 'Email record not found.' };

      dbHelper.run('UPDATE emails SET proposed_reply = ? WHERE id = ?', [args.reply_text, args.email_id]);
      return { success: true, message: `Reply drafted for email "${email.subject}". Available for review on Communications tab.` };
    }
  },

  // 8. Get Daily Operational Summary
  get_daily_operational_summary: {
    name: 'get_daily_operational_summary',
    description: 'Compile an operational summary: pending orders, stock shortages, delayed shipments, and tasks for today.',
    parameters: { type: 'object', properties: {} },
    execute(userId) {
      const lowStock = dbHelper.all('SELECT name, current_stock, min_threshold, unit FROM products WHERE user_id = ? AND current_stock <= min_threshold', [userId]);
      const pendingOrders = dbHelper.all("SELECT order_number, total_amount, status FROM orders WHERE user_id = ? AND status != 'Dispatched'", [userId]);
      const pendingApprovals = dbHelper.all("SELECT title, amount, urgency FROM approvals WHERE user_id = ? AND status = 'Pending'", [userId]);
      const urgentEmails = dbHelper.all("SELECT sender_name, subject, category FROM emails WHERE user_id = ? AND (urgency = 'High' OR requires_approval = 1)", [userId]);
      const openTasks = dbHelper.all("SELECT title, due_time, priority FROM tasks WHERE user_id = ? AND status = 'Pending'", [userId]);

      return {
        summary: {
          lowStockCount: lowStock.length,
          criticalItems: lowStock.map(p => `${p.name} (${p.current_stock}/${p.min_threshold} ${p.unit})`),
          pendingOrdersCount: pendingOrders.length,
          ordersWithShortage: pendingOrders.filter(o => o.status.includes('Shortage')).map(o => o.order_number),
          pendingApprovalsCount: pendingApprovals.length,
          topApprovals: pendingApprovals.map(a => `${a.title} (${a.amount || 'Review'})`),
          urgentCommunicationsCount: urgentEmails.length,
          urgentMessages: urgentEmails.map(e => `${e.sender_name}: ${e.subject}`),
          openTasksCount: openTasks.length
        }
      };
    }
  },

  // 9. Create Operational Task
  create_operational_task: {
    name: 'create_operational_task',
    description: 'Add an operational task or reminder to today\'s priority checklist.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Action item title' },
        priority: { type: 'string', enum: ['High', 'Medium', 'Normal'] },
        due_time: { type: 'string', description: 'e.g. 03:00 PM' }
      },
      required: ['title']
    },
    execute(userId, args) {
      const id = `tsk_${Date.now()}`;
      dbHelper.run(`
        INSERT INTO tasks (id, user_id, title, priority, due_time, category, assigned_to, status)
        VALUES (?, ?, ?, ?, ?, 'Operations', 'Owner', 'Pending')
      `, [id, userId, args.title, args.priority || 'Medium', args.due_time || '05:00 PM']);

      return { success: true, taskId: id, title: args.title, message: 'Task added to Today\'s Priorities checklist.' };
    }
  }
};

/**
 * Format tools for OpenAI/Groq function calling
 */
export function getOpenAiToolsFormat() {
  return Object.values(toolRegistry).map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));
}

/**
 * Format tools for Google Gemini function declarations
 */
export function getGeminiToolsFormat() {
  const functionDeclarations = Object.values(toolRegistry).map(t => {
    const cleanProperties = {};
    if (t.parameters && t.parameters.properties) {
      for (const [key, prop] of Object.entries(t.parameters.properties)) {
        cleanProperties[key] = {
          type: (prop.type || 'string').toUpperCase(),
          description: prop.description || ''
        };
        if (prop.enum) {
          cleanProperties[key].enum = prop.enum;
        }
      }
    }
    return {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'OBJECT',
        properties: cleanProperties,
        ...(t.parameters?.required ? { required: t.parameters.required } : {})
      }
    };
  });

  return [{ functionDeclarations }];
}
