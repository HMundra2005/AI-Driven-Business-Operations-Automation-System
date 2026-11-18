import { dbHelper } from '../db/database.js';

export const inventoryController = {
  getProducts(req, res) {
    try {
      const products = dbHelper.all(`
        SELECT p.*, s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.user_id = ?
        ORDER BY 
          CASE 
            WHEN p.current_stock <= (p.min_threshold / 2) THEN 1
            WHEN p.current_stock <= p.min_threshold THEN 2
            ELSE 3
          END,
          p.name ASC
      `, [req.user.id]);

      const formatted = products.map(p => {
        let status = 'In Stock';
        if (p.current_stock <= Math.floor(p.min_threshold / 2)) {
          status = 'Critical';
        } else if (p.current_stock <= p.min_threshold) {
          status = 'Low Stock';
        }
        return { ...p, status };
      });

      res.json({ products: formatted });
    } catch (err) {
      console.error('getProducts error:', err);
      res.status(500).json({ error: 'Failed to retrieve products.' });
    }
  },

  addProduct(req, res) {
    try {
      const { sku, name, category, currentStock, minThreshold, unit, unitPrice, supplierId } = req.body;
      if (!sku || !name || !category) {
        return res.status(400).json({ error: 'SKU, Product Name, and Category are required.' });
      }

      const id = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      dbHelper.run(`
        INSERT INTO products (id, user_id, sku, name, category, current_stock, min_threshold, unit, unit_price, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        req.user.id,
        sku.trim(),
        name.trim(),
        category.trim(),
        parseInt(currentStock, 10) || 0,
        parseInt(minThreshold, 10) || 10,
        unit || 'units',
        parseFloat(unitPrice) || 0.0,
        supplierId || null
      ]);

      const created = dbHelper.get('SELECT * FROM products WHERE id = ?', [id]);
      res.status(201).json({ product: created });
    } catch (err) {
      console.error('addProduct error:', err);
      res.status(500).json({ error: 'Failed to add product.' });
    }
  },

  updateStock(req, res) {
    try {
      const { productId } = req.params;
      const { newStock, adjustment } = req.body;

      const product = dbHelper.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, req.user.id]);
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      let updatedStock = product.current_stock;
      if (typeof newStock === 'number') {
        updatedStock = newStock;
      } else if (typeof adjustment === 'number') {
        updatedStock += adjustment;
      }

      if (updatedStock < 0) updatedStock = 0;

      dbHelper.run(`
        UPDATE products 
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [updatedStock, productId, req.user.id]);

      const updated = dbHelper.get('SELECT * FROM products WHERE id = ?', [productId]);
      res.json({ product: updated });
    } catch (err) {
      console.error('updateStock error:', err);
      res.status(500).json({ error: 'Failed to update stock.' });
    }
  },

  getShortages(req, res) {
    try {
      // Find products below threshold or with order shortages
      const lowStockProducts = dbHelper.all(`
        SELECT p.*, s.name as supplier_name, (p.min_threshold - p.current_stock) as deficit
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.user_id = ? AND p.current_stock <= p.min_threshold
        ORDER BY p.current_stock ASC
      `, [req.user.id]);

      res.json({ shortages: lowStockProducts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to calculate shortages.' });
    }
  },

  draftReplenishmentPO(req, res) {
    try {
      const { productId, reorderQuantity } = req.body;
      const product = dbHelper.get(`
        SELECT p.*, s.name as supplier_name, s.id as supplier_id 
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ? AND p.user_id = ?
      `, [productId, req.user.id]);

      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const qty = parseInt(reorderQuantity, 10) || (product.min_threshold * 2 - product.current_stock);
      const estimatedCost = (qty * product.unit_price).toLocaleString('en-IN');
      const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const approvalId = `appr_${Date.now()}`;

      dbHelper.run(`
        INSERT INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by)
        VALUES (?, ?, 'Purchase Order', ?, ?, ?, 'High', 'Pending', ?, 'Inventory Automation')
      `, [
        approvalId,
        req.user.id,
        `${product.supplier_name || 'Supplier'} - Restock ${product.name}`,
        `Draft PO for ${qty} ${product.unit} of ${product.name} to replenish stock deficit.`,
        `₹${estimatedCost}`,
        poNumber
      ]);

      res.status(201).json({
        message: `Replenishment Purchase Order draft created: ${poNumber}`,
        poNumber,
        approvalId
      });
    } catch (err) {
      console.error('draftReplenishmentPO error:', err);
      res.status(500).json({ error: 'Failed to draft purchase order.' });
    }
  }
};
