import { dbHelper } from '../db/database.js';

export const orderController = {
  getOrders(req, res) {
    try {
      const orders = dbHelper.all(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [req.user.id]);

      // Attach items to each order
      const ordersWithItems = orders.map(order => {
        const items = dbHelper.all(`
          SELECT oi.*, p.name as product_name, p.unit, p.current_stock
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);
        return { ...order, items };
      });

      res.json({ orders: ordersWithItems });
    } catch (err) {
      console.error('getOrders error:', err);
      res.status(500).json({ error: 'Failed to retrieve orders.' });
    }
  },

  createOrder(req, res) {
    try {
      const { customerId, items, notes } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item.' });
      }

      const orderId = `ord_${Date.now()}`;
      const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      let totalAmount = 0.0;
      let hasShortage = false;
      const shortageDetails = [];

      // Evaluate stock for each item
      const processedItems = items.map(item => {
        const product = dbHelper.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [item.productId, req.user.id]);
        if (!product) {
          throw new Error(`Product ${item.productId} not found.`);
        }

        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unitPrice || product.unit_price);
        totalAmount += qty * price;

        let itemStatus = 'Available';
        if (product.current_stock < qty) {
          itemStatus = 'Shortage';
          hasShortage = true;
          const deficit = qty - product.current_stock;
          shortageDetails.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.current_stock,
            requestedQty: qty,
            deficit
          });
        }

        return {
          id: `itm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          quantity: qty,
          unitPrice: price,
          status: itemStatus
        };
      });

      // Insert Order
      const orderStatus = hasShortage ? 'Pending (Stock Shortage)' : 'Pending';
      dbHelper.run(`
        INSERT INTO orders (id, user_id, order_number, customer_id, status, total_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, req.user.id, orderNumber, customerId || null, orderStatus, totalAmount, notes || null]);

      // Insert Order Items
      for (const item of processedItems) {
        dbHelper.run(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [item.id, orderId, item.productId, item.quantity, item.unitPrice, item.status]);
      }

      // If shortages exist, generate automated Replenishment Draft in Approvals!
      if (hasShortage) {
        for (const shortage of shortageDetails) {
          const product = dbHelper.get(`
            SELECT p.*, s.name as supplier_name, s.id as supplier_id 
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
          `, [shortage.productId]);

          const reorderQty = shortage.deficit + (product.min_threshold || 10);
          const estAmount = (reorderQty * product.unit_price).toLocaleString('en-IN');
          const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

          dbHelper.run(`
            INSERT INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by)
            VALUES (?, ?, 'Purchase Order', ?, ?, ?, 'High', 'Pending', ?, 'Order Shortage Engine')
          `, [
            `appr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            req.user.id,
            `${product.supplier_name || 'Vendor'} - Shortage Replenishment for ${orderNumber}`,
            `Order ${orderNumber} requires ${shortage.requestedQty} units of ${shortage.productName}, but only ${shortage.currentStock} are available (Deficit: ${shortage.deficit}). Proposed restock: ${reorderQty} units.`,
            `₹${estAmount}`,
            poNumber
          ]);
        }
      }

      const createdOrder = dbHelper.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      res.status(201).json({
        order: createdOrder,
        items: processedItems,
        hasShortage,
        shortageDetails,
        message: hasShortage
          ? `Order created with stock shortages detected! Automated replenishment drafts added to Pending Approvals.`
          : `Order ${orderNumber} created successfully with stock available.`
      });
    } catch (err) {
      console.error('createOrder error:', err);
      res.status(500).json({ error: err.message || 'Failed to create order.' });
    }
  },

  updateStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = dbHelper.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // If status transitioning to 'Dispatched', decrement stock
      if (status === 'Dispatched' && order.status !== 'Dispatched') {
        const items = dbHelper.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        for (const itm of items) {
          dbHelper.run(`
            UPDATE products
            SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [itm.quantity, itm.product_id]);
        }
      }

      dbHelper.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
      res.json({ message: `Order status updated to ${status}` });
    } catch (err) {
      console.error('updateStatus error:', err);
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  }
};
