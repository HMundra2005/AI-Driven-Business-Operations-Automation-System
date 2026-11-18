import { dbHelper } from '../db/database.js';

/**
 * Autonomous Background Email Worker & Entity-Feasibility Engine
 * 
 * Works completely autonomously in the background without user presence:
 * 1. Detects incoming customer and vendor emails.
 * 2. Scans for product references and requested quantities.
 * 3. Cross-references live inventory records in SQLite.
 * 4. Available stock: Prepares automated verified availability reply.
 * 5. Out of stock / Shortage:
 *    - Calculates exact deficit.
 *    - Automatically creates a High-Priority Task for the owner in `tasks`.
 *    - Automatically drafts a Restock Purchase Order in `approvals`.
 *    - Prepares a truthful status reply and flags for owner review.
 */
export function processSingleEmail(email) {
  try {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    let category = 'General';
    let urgency = 'Normal';
    let requiresApproval = 0;
    let proposedReply = '';

    // Retrieve user's catalog to cross-reference live products
    const userProducts = dbHelper.all(`
      SELECT p.*, s.name as supplier_name 
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.user_id = ?
    `, [email.user_id]);

    // Check if email mentions any catalog product
    let matchedProduct = null;
    for (const prod of userProducts) {
      const prodName = prod.name.toLowerCase();
      const sku = prod.sku.toLowerCase();
      // Match key terms like 'basmati', 'sunflower oil', 'atta', 'toor dal', 'sugar', 'jaggery'
      const keyTokens = prodName.split(/[\s()/-]+/).filter(w => w.length > 3 && !['premium', 'refined', 'super', 'grade', 'blocks'].includes(w));
      const hasMatch = keyTokens.some(token => text.includes(token)) || text.includes(sku);
      if (hasMatch) {
        matchedProduct = prod;
        break;
      }
    }

    // Extract quantity if mentioned (e.g., "25 bags", "20 units", "15 tins", "order 20", "need 30")
    let requestedQuantity = 10; // default order quantity
    const qtyMatch = text.match(/(\d+)\s*(bags?|tins?|bottles?|pouches?|units?|kgs?|boxes?)/i) || text.match(/(?:order|need|want|demand|buy|send)\s*(\d+)/i);
    if (qtyMatch) {
      requestedQuantity = parseInt(qtyMatch[1], 10);
    }

    // 1. Autonomous Product Demand & Inventory Cross-Reference
    if (matchedProduct && (text.includes('order') || text.includes('demand') || text.includes('need') || text.includes('available') || text.includes('stock') || text.includes('price') || text.includes('quote') || text.includes('buy'))) {
      category = 'Order Inquiry';
      const availableStock = matchedProduct.current_stock;

      if (availableStock >= requestedQuantity) {
        // SCENARIO A: Stock is Available!
        urgency = 'Normal';
        requiresApproval = 0; // Routine inquiry with verified stock availability
        proposedReply = `Thank you for your inquiry. We have checked our live warehouse inventory: "${matchedProduct.name}" is currently in stock with ${availableStock} ${matchedProduct.unit} on hand. We can fulfill your demand of ${requestedQuantity} ${matchedProduct.unit} at ₹${matchedProduct.unit_price}/${matchedProduct.unit} immediately. Please confirm to proceed with dispatch.`;
      } else {
        // SCENARIO B: Stock Shortage / Out of Stock!
        const deficit = requestedQuantity - availableStock;
        urgency = 'High';
        requiresApproval = 1; // Shortage commitment requires owner sign-off
        proposedReply = `Stock Feasibility Alert: You requested ${requestedQuantity} ${matchedProduct.unit} of "${matchedProduct.name}". Our warehouse currently only has ${availableStock} ${matchedProduct.unit} on hand (Deficit: ${deficit} ${matchedProduct.unit}). A priority replenishment request has been initiated with our supplier (${matchedProduct.supplier_name || 'Vendor'}).`;

        // AUTONOMOUS AGENT ACTION 1: Automatically insert a High-Priority Task for the owner!
        const taskId = `tsk_auto_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const existingTask = dbHelper.get('SELECT id FROM tasks WHERE title LIKE ? AND user_id = ?', [`%${matchedProduct.name}%`, email.user_id]);
        if (!existingTask) {
          dbHelper.run(`
            INSERT INTO tasks (id, user_id, title, priority, due_time, category, assigned_to, status)
            VALUES (?, ?, ?, 'High', '11:00 AM', 'Procurement', 'Owner', 'Pending')
          `, [
            taskId,
            email.user_id,
            `Stock Shortage Alert: Customer ${email.sender_name || email.sender} demands ${requestedQuantity} ${matchedProduct.unit} of ${matchedProduct.name}, but stock is only ${availableStock}. Place restock PO to ${matchedProduct.supplier_name || 'Vendor'}.`
          ]);
        }

        // AUTONOMOUS AGENT ACTION 2: Automatically draft a Purchase Order into Approvals queue!
        const poApprovalId = `appr_po_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const reorderQty = deficit + (matchedProduct.min_threshold || 10);
        const estAmount = `₹${(reorderQty * matchedProduct.unit_price).toLocaleString('en-IN')}`;
        const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const existingPO = dbHelper.get('SELECT id FROM approvals WHERE details LIKE ? AND user_id = ?', [`%${matchedProduct.name}%`, email.user_id]);
        if (!existingPO) {
          dbHelper.run(`
            INSERT INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by)
            VALUES (?, ?, 'Purchase Order', ?, ?, ?, 'High', 'Pending', ?, 'Autonomous Email Agent')
          `, [
            poApprovalId,
            email.user_id,
            `${matchedProduct.supplier_name || 'Vendor'} - Restock for ${matchedProduct.name}`,
            `Autonomous restock trigger: Incoming inquiry from ${email.sender_name || email.sender} demands ${requestedQuantity} ${matchedProduct.unit}, exceeding current stock (${availableStock} available). Drafted replenishment of ${reorderQty} ${matchedProduct.unit}.`,
            estAmount,
            poNumber
          ]);
        }
      }
    } 
    // 2. Financial / Credit / Invoicing Messages
    else if (text.includes('credit') || text.includes('invoice') || text.includes('payment') || text.includes('balance') || text.includes('rs.') || text.includes('₹')) {
      category = 'Billing/Invoicing';
      urgency = 'Medium';
      requiresApproval = 1;
      proposedReply = `Owner Review Required: Message requests financial credit extension or payment adjustments. Action must be authorized before replying.`;
    } 
    // 3. Complaints & Damaged Consignments
    else if (text.includes('complaint') || text.includes('damage') || text.includes('torn') || text.includes('defect') || text.includes('replacement')) {
      category = 'Complaint';
      urgency = 'High';
      requiresApproval = 1;
      proposedReply = `Owner Review Required: Customer reported consignment damage or dissatisfaction. Authorization required for credit note or replacement.`;
    } 
    // 4. Delivery & Logistics
    else if (text.includes('delay') || text.includes('breakdown') || text.includes('tire') || text.includes('transit') || text.includes('traffic') || text.includes('eta')) {
      category = 'Delivery/Logistics';
      urgency = 'High';
      proposedReply = `Acknowledged receipt of transit delay notification. Dispatch team and receiving dock have been notified of revised ETA.`;
    } 
    // 5. Existing Order Lookup
    else if (text.includes('order') || text.includes('dispatch') || text.includes('shipment') || text.includes('ord-')) {
      category = 'Order Inquiry';
      urgency = text.includes('urgent') || text.includes('empty') ? 'High' : 'Medium';
      
      const orderMatch = text.match(/ord-\d+/i);
      if (orderMatch) {
        const orderNum = orderMatch[0].toUpperCase();
        const existingOrder = dbHelper.get('SELECT * FROM orders WHERE order_number = ? AND user_id = ?', [orderNum, email.user_id]);
        if (existingOrder) {
          if (existingOrder.status.includes('Shortage')) {
            requiresApproval = 1;
            proposedReply = `Order ${orderNum} currently has an inventory shortage. Restocking purchase order has been drafted for owner authorization.`;
          } else {
            proposedReply = `Thank you for inquiring. Order ${orderNum} is currently in '${existingOrder.status}' status and scheduled for delivery.`;
          }
        } else {
          proposedReply = `Thank you for contacting us regarding Order ${orderNum}. Our operations desk is reviewing the manifest and will update you shortly.`;
        }
      } else {
        proposedReply = `Thank you for reaching out. We have received your order query and our dispatch supervisor is cross-checking today's schedule.`;
      }
    } else {
      proposedReply = `Thank you for your message. Apex Wholesale & Retail operations team has received your communication and will follow up shortly.`;
    }

    // If requires approval, insert into approvals queue if not already inserted
    if (requiresApproval) {
      const existingAppr = dbHelper.get('SELECT id FROM approvals WHERE reference_id = ? AND user_id = ?', [email.id, email.user_id]);
      if (!existingAppr) {
        dbHelper.run(`
          INSERT INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by)
          VALUES (?, ?, 'Sensitive Email Action', ?, ?, 'Review', ?, 'Pending', ?, 'Email Intelligence Worker')
        `, [
          `appr_em_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          email.user_id,
          `${category}: ${email.sender_name || email.sender}`,
          `Incoming message requires owner sign-off: "${email.subject}". ${proposedReply}`,
          urgency,
          email.id
        ]);
      }
    }

    // Update email record in database
    dbHelper.run(`
      UPDATE emails
      SET is_processed = 1, category = ?, urgency = ?, requires_approval = ?, proposed_reply = ?
      WHERE id = ?
    `, [category, urgency, requiresApproval, proposedReply, email.id]);

    return { id: email.id, category, urgency, requiresApproval, proposedReply };
  } catch (err) {
    console.error(`Error processing email ${email.id}:`, err);
    return null;
  }
}

export function processUnprocessedEmails(userId = null) {
  let query = 'SELECT * FROM emails WHERE is_processed = 0';
  const params = [];
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  const pendingEmails = dbHelper.all(query, params);
  const results = [];
  for (const email of pendingEmails) {
    const res = processSingleEmail(email);
    if (res) results.push(res);
  }
  return results;
}

// Background scheduler
let workerInterval = null;

export function startEmailWorker() {
  if (workerInterval) clearInterval(workerInterval);
  workerInterval = setInterval(() => {
    try {
      const processed = processUnprocessedEmails();
      if (processed.length > 0) {
        console.log(`[EmailWorker] Autonomous agent processed ${processed.length} new incoming email(s).`);
      }
    } catch (e) {
      console.error('[EmailWorker] Interval error:', e);
    }
  }, 10000);
}
