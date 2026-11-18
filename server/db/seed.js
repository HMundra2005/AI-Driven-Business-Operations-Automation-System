import bcrypt from 'bcryptjs';
import { db, dbHelper } from './database.js';

export function seedDemoData() {
  const existingUser = dbHelper.get('SELECT id FROM users WHERE email = ?', ['demo@opsautomate.com']);
  if (existingUser) {
    return existingUser.id; // Already seeded
  }

  const demoUserId = 'usr_demo_1001';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Demo@123', salt);

  // Create Demo User
  dbHelper.run(`
    INSERT INTO users (id, email, password_hash, business_name)
    VALUES (?, ?, ?, ?)
  `, [demoUserId, 'demo@opsautomate.com', passwordHash, 'Apex Wholesale & Retail']);

  seedUserEnvironment(demoUserId);
  return demoUserId;
}

export function seedUserEnvironment(userId) {
  // 1. Suppliers
  const sup1 = `sup_${Date.now()}_1`;
  const sup2 = `sup_${Date.now()}_2`;
  const sup3 = `sup_${Date.now()}_3`;

  dbHelper.run(`
    INSERT OR IGNORE INTO suppliers (id, user_id, name, contact_person, email, phone, lead_time_days) VALUES
    (?, ?, 'Supreme Agro Mills', 'Mahesh Rawat', 'orders@supremeagro.com', '+91 98290 11223', 2),
    (?, ?, 'Krishna Edible Oils Ltd.', 'Pooja Hegde', 'sales@krishnaoils.com', '+91 94140 88776', 3),
    (?, ?, 'Apex Packaging Solutions', 'Sanjay Singhal', 'dispatch@apexpack.in', '+91 98281 44556', 4)
  `, [sup1, userId, sup2, userId, sup3, userId]);

  // 2. Customers
  const cust1 = `cust_${Date.now()}_1`;
  const cust2 = `cust_${Date.now()}_2`;
  const cust3 = `cust_${Date.now()}_3`;

  dbHelper.run(`
    INSERT OR IGNORE INTO customers (id, user_id, name, contact_person, email, phone, address) VALUES
    (?, ?, 'Metro Grocers Wholesale', 'Kunal Mehra', 'kunal@metrogrocers.in', '+91 98292 33441', 'Plot 42, Transport Nagar, Jaipur'),
    (?, ?, 'City Supermarket', 'Anil Sharma', 'orders@citysupermarket.com', '+91 94141 55662', 'Shop 12-14, Commercial Complex, Tonk Road'),
    (?, ?, 'Sharma Traders', 'Gopal Sharma', 'gopal@sharmatraders.net', '+91 99280 77889', 'M.I. Road Wholesale Market')
  `, [cust1, userId, cust2, userId, cust3, userId]);

  // 3. Products
  const prod1 = `prd_${Date.now()}_1`;
  const prod2 = `prd_${Date.now()}_2`;
  const prod3 = `prd_${Date.now()}_3`;
  const prod4 = `prd_${Date.now()}_4`;
  const prod5 = `prd_${Date.now()}_5`;
  const prod6 = `prd_${Date.now()}_6`;
  const prod7 = `prd_${Date.now()}_7`;

  dbHelper.run(`
    INSERT OR IGNORE INTO products (id, user_id, sku, name, category, current_stock, min_threshold, unit, unit_price, supplier_id) VALUES
    (?, ?, 'SKU-1001', 'Basmati Rice Premium (25kg Bag)', 'Grains & Staples', 4, 15, 'bags', 2100.0, ?),
    (?, ?, 'SKU-1002', 'Refined Sunflower Oil (15L Tin)', 'Edible Oils', 8, 20, 'tins', 1650.0, ?),
    (?, ?, 'SKU-1003', 'Whole Wheat Flour / Atta (10kg)', 'Flour & Pulses', 12, 30, 'bags', 380.0, ?),
    (?, ?, 'SKU-1004', 'Toor Dal Super Grade (50kg Bag)', 'Pulses', 2, 10, 'bags', 6400.0, ?),
    (?, ?, 'SKU-1005', 'Organic Jaggery Blocks (1kg Pouch)', 'Sweeteners', 15, 25, 'pouches', 75.0, ?),
    (?, ?, 'SKU-1006', 'Mustard Oil Pure Kachi Ghani (1L Bottle)', 'Edible Oils', 45, 20, 'bottles', 140.0, ?),
    (?, ?, 'SKU-1007', 'Refined White Sugar (50kg Bag)', 'Sweeteners', 32, 15, 'bags', 2150.0, ?)
  `, [
    prod1, userId, sup1,
    prod2, userId, sup2,
    prod3, userId, sup1,
    prod4, userId, sup1,
    prod5, userId, sup3,
    prod6, userId, sup2,
    prod7, userId, sup3
  ]);

  // 4. Orders & Order Items
  const ord1 = `ord_${Date.now()}_1`;
  const ord2 = `ord_${Date.now()}_2`;
  const ord3 = `ord_${Date.now()}_3`;

  dbHelper.run(`
    INSERT OR IGNORE INTO orders (id, user_id, order_number, customer_id, status, total_amount, notes) VALUES
    (?, ?, 'ORD-4491', ?, 'Pending', 42000.0, 'Bulk festive order - Basmati Rice & Oil'),
    (?, ?, 'ORD-4492', ?, 'Ready for Dispatch', 11200.0, 'Regular weekly restocking consignment'),
    (?, ?, 'ORD-4493', ?, 'Pending', 64500.0, 'High value wholesale shipment awaiting credit verification')
  `, [ord1, userId, cust1, ord2, userId, cust2, ord3, userId, cust3]);

  // Items for ORD-4491: Customer ordered 20 bags of Basmati Rice (Current Stock is only 4 -> Shortage of 16!)
  dbHelper.run(`
    INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, status) VALUES
    (?, ?, ?, 20, 2100.0, 'Shortage')
  `, [`itm_${Date.now()}_1`, ord1, prod1]);

  // Items for ORD-4492: 5 tins of Sunflower oil
  dbHelper.run(`
    INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, status) VALUES
    (?, ?, ?, 5, 1650.0, 'Available')
  `, [`itm_${Date.now()}_2`, ord2, prod2]);

  // 5. Emails
  const em1 = `em_${Date.now()}_1`;
  const em2 = `em_${Date.now()}_2`;
  const em3 = `em_${Date.now()}_3`;
  const em4 = `em_${Date.now()}_4`;

  dbHelper.run(`
    INSERT OR IGNORE INTO emails (id, user_id, sender, sender_name, subject, body, channel, category, urgency, is_read, is_processed, requires_approval, proposed_reply, reply_status) VALUES
    (?, ?, 'kunal@metrogrocers.in', 'Kunal Mehra (Metro Grocers)', 'Urgent: Dispatch status for Order #ORD-4491 (20 bags Basmati)', 'Dear Rajesh, please confirm if our order #ORD-4491 will be dispatched today before 3 PM. Our store shelves are empty.', 'WhatsApp Business', 'Order Inquiry', 'High', 0, 1, 0, 'Dear Kunal, order ORD-4491 has an inventory buffer shortfall of 16 bags. A priority replenishment PO has been drafted to Supreme Agro Mills.', 'Ready to Send'),
    (?, ?, 'dispatch@sunrisefreight.in', 'Sunrise Logistics', 'Transit Delay Notification - Consignment #SN-8921', 'Notice: Vehicle experienced tire failure near highway toll. Estimated arrival delayed by 2.5 hours. New ETA is 4:30 PM.', 'Email', 'Delivery/Logistics', 'High', 1, 1, 0, 'Acknowledged. Please instruct driver to call gate staff upon entry.', 'Ready to Send'),
    (?, ?, 'gopal@sharmatraders.net', 'Gopal Sharma (Sharma Traders)', 'Request for 15-day Credit Extension on Invoice #INV-889', 'Dear Apex Management, due to delayed customer collections, we kindly request a 15-day credit extension for our pending balance of Rs. 78,500.', 'Email', 'Billing/Invoicing', 'Medium', 0, 1, 1, 'Approval required: Financial extension exceeds default 7-day payment window.', 'Awaiting Review'),
    (?, ?, 'anand@anandprovisions.com', 'Anand Provisions', 'Complaint: 2 Torn Sacks in Consignment #CS-441', 'We found 2 sacks of wheat flour torn during delivery unloading today. Please issue replacement credit note of Rs. 760.', 'Email', 'Complaint', 'Medium', 0, 1, 1, 'Approval required: Credit note authorization for transit damage.', 'Awaiting Review')
  `, [em1, userId, em2, userId, em3, userId, em4, userId]);

  // 6. Tasks
  dbHelper.run(`
    INSERT OR IGNORE INTO tasks (id, user_id, title, priority, due_time, category, assigned_to, status) VALUES
    (?, ?, 'Follow up with Sunrise Logistics on delayed delivery ETA', 'High', '11:30 AM', 'Supply Chain', 'Rajesh (Owner)', 'Pending'),
    (?, ?, 'Review & authorize purchase order PO-2026-089 for Basmati Rice', 'High', '01:00 PM', 'Procurement', 'Rajesh (Owner)', 'Pending'),
    (?, ?, 'Perform physical stock count for Toor Dal batch #TD-440', 'Medium', '03:30 PM', 'Inventory', 'Warehouse Team', 'Pending'),
    (?, ?, 'Call Sharma Traders regarding payment receipt verification', 'Medium', '05:00 PM', 'Finance', 'Accounts', 'Pending')
  `, [
    `tsk_${Date.now()}_1`, userId,
    `tsk_${Date.now()}_2`, userId,
    `tsk_${Date.now()}_3`, userId,
    `tsk_${Date.now()}_4`, userId
  ]);

  // 7. Approvals
  dbHelper.run(`
    INSERT OR IGNORE INTO approvals (id, user_id, type, title, details, amount, urgency, status, reference_id, requested_by) VALUES
    (?, ?, 'Purchase Order', 'Supreme Agro Mills - Basmati Restock', 'Restock for 20 bags of 25kg Basmati Rice ahead of weekend demand.', '₹42,000', 'High', 'Pending', 'PO-2026-089', 'Arvind (Store Mgr)'),
    (?, ?, 'Credit Override', 'Sharma Traders - 15-day Credit Extension', 'Existing credit cap is ₹50,000. Customer requesting extension to ₹78,500.', '₹78,500', 'Medium', 'Pending', 'CR-2026-034', 'Accounts Desk'),
    (?, ?, 'Damaged Return', 'Metro Mart Wholesale - Oil Tin Replacement', 'Credit note authorization for 3 oil tins damaged during transit.', '₹4,950', 'Normal', 'Pending', 'RET-2026-012', 'Logistics Team')
  `, [
    `appr_${Date.now()}_1`, userId,
    `appr_${Date.now()}_2`, userId,
    `appr_${Date.now()}_3`, userId
  ]);

  // 8. Default layout in user_settings
  const defaultLayout = JSON.stringify(['inventory', 'approvals', 'communications', 'tasks']);
  dbHelper.run(`
    INSERT OR REPLACE INTO user_settings (user_id, layout_json, auto_replies_enabled)
    VALUES (?, ?, 0)
  `, [userId, defaultLayout]);
}
