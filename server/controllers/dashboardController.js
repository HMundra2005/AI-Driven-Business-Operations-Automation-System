import { dbHelper } from '../db/database.js';

export const dashboardController = {
  getSummaryMetrics(req, res) {
    try {
      const pendingOrdersCount = dbHelper.get(`
        SELECT COUNT(*) as count FROM orders 
        WHERE user_id = ? AND status NOT IN ('Dispatched', 'Delivered', 'Cancelled')
      `, [req.user.id])?.count || 0;

      const lowStockCount = dbHelper.get(`
        SELECT COUNT(*) as count FROM products 
        WHERE user_id = ? AND current_stock <= min_threshold
      `, [req.user.id])?.count || 0;

      const pendingApprovalsCount = dbHelper.get(`
        SELECT COUNT(*) as count FROM approvals 
        WHERE user_id = ? AND status = 'Pending'
      `, [req.user.id])?.count || 0;

      res.json({
        metrics: {
          pendingOrders: {
            value: pendingOrdersCount,
            label: "Pending Orders",
            subtext: `${pendingOrdersCount} orders currently in fulfillment pipeline`,
            badge: pendingOrdersCount > 0 ? "Action Needed" : "Optimal",
            type: "orders"
          },
          lowStockItems: {
            value: lowStockCount,
            label: "Low-Stock Items",
            subtext: `${lowStockCount} items below safety reorder thresholds`,
            badge: lowStockCount > 0 ? "Attention" : "All Stocked",
            type: "inventory"
          },
          pendingApprovals: {
            value: pendingApprovalsCount,
            label: "Pending Approvals",
            subtext: `${pendingApprovalsCount} consequential actions awaiting owner sign-off`,
            badge: pendingApprovalsCount > 0 ? "Owner Review" : "Queue Empty",
            type: "approvals"
          }
        }
      });
    } catch (err) {
      console.error('getSummaryMetrics error:', err);
      res.status(500).json({ error: 'Failed to calculate summary metrics.' });
    }
  },

  getWidgetsData(req, res) {
    try {
      // Rule: MAX 3 items per widget!
      
      // 1. Inventory & Stock: Top 3 critical/low items
      const inventoryRaw = dbHelper.all(`
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.user_id = ?
        ORDER BY 
          CASE 
            WHEN p.current_stock <= (p.min_threshold / 2) THEN 1
            WHEN p.current_stock <= p.min_threshold THEN 2
            ELSE 3
          END,
          p.current_stock ASC
        LIMIT 3
      `, [req.user.id]);

      const inventory = inventoryRaw.map(p => ({
        id: p.sku || p.id,
        name: p.name,
        category: p.category,
        currentStock: p.current_stock,
        reorderLevel: p.min_threshold,
        unit: p.unit,
        unitPrice: p.unit_price,
        status: p.current_stock <= Math.floor(p.min_threshold / 2) ? 'Critical' : (p.current_stock <= p.min_threshold ? 'Low Stock' : 'Healthy')
      }));

      // 2. Pending Approvals: Top 3 pending items
      const approvals = dbHelper.all(`
        SELECT id, type, title, requested_by as requestedBy, amount, 
               created_at as date, urgency, status, details
        FROM approvals
        WHERE user_id = ? AND status = 'Pending'
        ORDER BY 
          CASE urgency WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          created_at DESC
        LIMIT 3
      `, [req.user.id]);

      // 3. Communications Requiring Attention: Top 3 urgent or unprocessed emails
      const communicationsRaw = dbHelper.all(`
        SELECT id, sender_name as sender, subject, body as preview, 
               urgency, channel, requires_approval, received_at as time
        FROM emails
        WHERE user_id = ?
        ORDER BY 
          requires_approval DESC,
          CASE urgency WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          received_at DESC
        LIMIT 3
      `, [req.user.id]);

      const communications = communicationsRaw.map(c => ({
        ...c,
        time: formatRelativeTime(c.time)
      }));

      // 4. Today's Tasks & Priorities: Top 3 pending tasks
      const tasks = dbHelper.all(`
        SELECT id, title, priority, due_time as dueTime, assigned_to as assignedTo, status, category
        FROM tasks
        WHERE user_id = ? AND status = 'Pending'
        ORDER BY 
          CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
          created_at DESC
        LIMIT 3
      `, [req.user.id]);

      // 5. Supplier Follow-ups: Top 3 suppliers with low stock items
      const suppliersRaw = dbHelper.all(`
        SELECT s.id, s.name as supplier, s.contact_person as contact,
               COUNT(p.id) as low_item_count,
               MIN(p.name) as sample_product
        FROM suppliers s
        JOIN products p ON p.supplier_id = s.id
        WHERE s.user_id = ? AND p.current_stock <= p.min_threshold
        GROUP BY s.id
        ORDER BY low_item_count DESC
        LIMIT 3
      `, [req.user.id]);

      const supplierFollowups = suppliersRaw.map(s => ({
        id: s.id,
        supplier: s.supplier,
        contact: s.contact,
        pendingItem: `${s.low_item_count} low-stock item(s) pending reorder (${s.sample_product})`,
        lastContact: "Yesterday",
        nextAction: "Confirm dispatch e-way bill",
        urgency: s.low_item_count > 1 ? "High" : "Medium"
      }));

      // 6. Unresolved Customer Issues: Top 3 complaints/inquiries requiring review
      const customerIssues = dbHelper.all(`
        SELECT id, sender_name as customer, subject as issue, 
               received_at as reported, urgency as severity,
               CASE WHEN requires_approval = 1 THEN 'Awaiting Owner Sign-off' ELSE 'Under Investigation' END as status
        FROM emails
        WHERE user_id = ? AND (category = 'Complaint' OR requires_approval = 1)
        ORDER BY received_at DESC
        LIMIT 3
      `, [req.user.id]);

      // 7. Recent Activity: Top 3 recent system records
      const recentOrders = dbHelper.all(`
        SELECT 'Order ' || order_number as action,
               'Amount: ₹' || total_amount || ' - Status: ' || status as details,
               created_at as time, 'Orders' as badge
        FROM orders WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 2
      `, [req.user.id]);

      const recentEmails = dbHelper.all(`
        SELECT 'Incoming Message' as action,
               sender_name || ': ' || subject as details,
               received_at as time, 'Email' as badge
        FROM emails WHERE user_id = ?
        ORDER BY received_at DESC LIMIT 1
      `, [req.user.id]);

      const recentActivity = [...recentOrders, ...recentEmails].slice(0, 3).map((act, idx) => ({
        id: `act_${idx + 1}`,
        ...act,
        time: formatRelativeTime(act.time)
      }));

      // 8. Upcoming Deadlines: Top 3 tasks with due times
      const deadlines = dbHelper.all(`
        SELECT id, title, due_time as dueDate, priority, category,
               'Today' as daysRemaining
        FROM tasks
        WHERE user_id = ? AND status = 'Pending'
        ORDER BY priority ASC
        LIMIT 3
      `, [req.user.id]);

      // 9. Order Status Overview: Top 3 orders in progress
      const orderStatusRaw = dbHelper.all(`
        SELECT o.id, o.order_number, c.name as client, o.status, o.total_amount as amount,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT 3
      `, [req.user.id]);

      const orderStatus = orderStatusRaw.map(o => ({
        id: o.order_number,
        client: o.client || 'Direct Wholesale Client',
        items: `${o.items_count} line item(s)`,
        amount: `₹${parseFloat(o.amount).toLocaleString('en-IN')}`,
        status: o.status,
        statusColor: o.status.includes('Shortage') ? 'amber' : (o.status === 'Dispatched' ? 'emerald' : 'blue')
      }));

      // 10. Completed Tasks: Top 3 closed tasks
      const completedTasks = dbHelper.all(`
        SELECT id, title, assigned_to as completedBy, 'Today' as completedAt
        FROM tasks
        WHERE user_id = ? AND status = 'Completed'
        ORDER BY created_at DESC
        LIMIT 3
      `, [req.user.id]);

      res.json({
        inventory,
        approvals,
        communications,
        tasks,
        supplierFollowups,
        customerIssues,
        recentActivity,
        deadlines,
        orderStatus,
        completedTasks
      });
    } catch (err) {
      console.error('getWidgetsData error:', err);
      res.status(500).json({ error: 'Failed to retrieve dashboard widgets data.' });
    }
  },

  getLayout(req, res) {
    try {
      const setting = dbHelper.get('SELECT layout_json FROM user_settings WHERE user_id = ?', [req.user.id]);
      const defaultLayout = ['inventory', 'approvals', 'communications', 'tasks'];
      const layout = setting && setting.layout_json ? JSON.parse(setting.layout_json) : defaultLayout;
      res.json({ layout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve layout settings.' });
    }
  },

  saveLayout(req, res) {
    try {
      const { layout } = req.body;
      if (!Array.isArray(layout) || layout.length !== 4) {
        return res.status(400).json({ error: 'Layout must be an array of exactly 4 unique widget IDs.' });
      }

      // Check for duplicates
      const uniqueIds = new Set(layout);
      if (uniqueIds.size !== 4) {
        return res.status(400).json({ error: 'Duplicate widgets are not allowed in the grid.' });
      }

      dbHelper.run(`
        INSERT INTO user_settings (user_id, layout_json)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET layout_json = excluded.layout_json
      `, [req.user.id, JSON.stringify(layout)]);

      res.json({ message: 'Dashboard layout preferences saved.', layout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save layout preferences.' });
    }
  }
};

function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour(s) ago`;
  return 'Yesterday';
}
