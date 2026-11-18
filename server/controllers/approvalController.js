import { dbHelper } from '../db/database.js';

export const approvalController = {
  getApprovals(req, res) {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM approvals WHERE user_id = ?';
      const params = [req.user.id];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += `
        ORDER BY 
          CASE urgency 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            ELSE 3 
          END,
          created_at DESC
      `;

      const approvals = dbHelper.all(query, params);
      res.json({ approvals });
    } catch (err) {
      console.error('getApprovals error:', err);
      res.status(500).json({ error: 'Failed to retrieve approvals.' });
    }
  },

  approveAction(req, res) {
    try {
      const { approvalId } = req.params;
      const approval = dbHelper.get('SELECT * FROM approvals WHERE id = ? AND user_id = ?', [approvalId, req.user.id]);
      if (!approval) {
        return res.status(404).json({ error: 'Approval item not found.' });
      }

      dbHelper.run(`
        UPDATE approvals 
        SET status = 'Approved'
        WHERE id = ?
      `, [approvalId]);

      // Side-effect: If it was a PO approval, log fulfillment in Tasks
      if (approval.type === 'Purchase Order') {
        dbHelper.run(`
          INSERT INTO tasks (id, user_id, title, priority, due_time, category, assigned_to, status)
          VALUES (?, ?, ?, 'Medium', 'End of Day', 'Procurement', 'Accounts Desk', 'Pending')
        `, [
          `tsk_po_${Date.now()}`,
          req.user.id,
          `Release vendor advance payment for approved ${approval.title} (${approval.amount || ''})`
        ]);
      }

      // Side-effect: If linked to email, mark email approved
      if (approval.reference_id && approval.reference_id.startsWith('em_')) {
        dbHelper.run(`
          UPDATE emails
          SET requires_approval = 0, reply_status = 'Approved - Ready to Dispatch'
          WHERE id = ? AND user_id = ?
        `, [approval.reference_id, req.user.id]);
      }

      res.json({
        message: `Approved: "${approval.title}" executed and recorded.`,
        approval: { ...approval, status: 'Approved' }
      });
    } catch (err) {
      console.error('approveAction error:', err);
      res.status(500).json({ error: 'Failed to process approval.' });
    }
  },

  rejectAction(req, res) {
    try {
      const { approvalId } = req.params;
      const { reason } = req.body;

      const approval = dbHelper.get('SELECT * FROM approvals WHERE id = ? AND user_id = ?', [approvalId, req.user.id]);
      if (!approval) {
        return res.status(404).json({ error: 'Approval item not found.' });
      }

      dbHelper.run(`
        UPDATE approvals 
        SET status = 'Rejected', details = details || ' [Rejected: ' || ? || ']'
        WHERE id = ?
      `, [reason || 'Rejected by business owner', approvalId]);

      res.json({
        message: `Rejected: "${approval.title}" has been dismissed.`,
        approval: { ...approval, status: 'Rejected' }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reject approval.' });
    }
  }
};
