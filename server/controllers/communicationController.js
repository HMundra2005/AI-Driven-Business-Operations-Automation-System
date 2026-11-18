import { dbHelper } from '../db/database.js';
import { processSingleEmail, processUnprocessedEmails } from '../services/emailWorker.js';

export const communicationController = {
  getEmails(req, res) {
    try {
      const emails = dbHelper.all(`
        SELECT * FROM emails
        WHERE user_id = ?
        ORDER BY received_at DESC
      `, [req.user.id]);
      res.json({ emails });
    } catch (err) {
      console.error('getEmails error:', err);
      res.status(500).json({ error: 'Failed to retrieve communications.' });
    }
  },

  simulateIncoming(req, res) {
    try {
      const { sender, senderName, subject, body, channel } = req.body;
      if (!sender || !subject || !body) {
        return res.status(400).json({ error: 'Sender, subject, and body are required.' });
      }

      const emailId = `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      dbHelper.run(`
        INSERT INTO emails (id, user_id, sender, sender_name, subject, body, channel, is_read, is_processed, requires_approval)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
      `, [
        emailId,
        req.user.id,
        sender.trim(),
        senderName ? senderName.trim() : sender.trim(),
        subject.trim(),
        body.trim(),
        channel || 'Email'
      ]);

      const inserted = dbHelper.get('SELECT * FROM emails WHERE id = ?', [emailId]);

      // Trigger intelligence worker immediately on arrival
      const processed = processSingleEmail(inserted);
      const updated = dbHelper.get('SELECT * FROM emails WHERE id = ?', [emailId]);

      res.status(201).json({
        message: 'Simulated email received and processed by background intelligence.',
        email: updated,
        processedInfo: processed
      });
    } catch (err) {
      console.error('simulateIncoming error:', err);
      res.status(500).json({ error: 'Failed to simulate incoming communication.' });
    }
  },

  triggerProcessing(req, res) {
    try {
      const processed = processUnprocessedEmails(req.user.id);
      res.json({
        message: `Processed ${processed.length} pending email(s).`,
        processed
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to trigger background processing.' });
    }
  },

  markRead(req, res) {
    try {
      const { emailId } = req.params;
      dbHelper.run('UPDATE emails SET is_read = 1 WHERE id = ? AND user_id = ?', [emailId, req.user.id]);
      res.json({ message: 'Email marked as read.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update email read state.' });
    }
  },

  approveAndSendReply(req, res) {
    try {
      const { emailId } = req.params;
      const { customizedReply } = req.body;

      const email = dbHelper.get('SELECT * FROM emails WHERE id = ? AND user_id = ?', [emailId, req.user.id]);
      if (!email) {
        return res.status(404).json({ error: 'Email not found.' });
      }

      const replyText = customizedReply || email.proposed_reply;

      dbHelper.run(`
        UPDATE emails
        SET reply_status = 'Sent', proposed_reply = ?, requires_approval = 0
        WHERE id = ?
      `, [replyText, emailId]);

      // Resolve corresponding approval item if exists
      dbHelper.run(`
        UPDATE approvals
        SET status = 'Approved'
        WHERE reference_id = ? AND user_id = ?
      `, [emailId, req.user.id]);

      res.json({
        message: `Reply to ${email.sender_name || email.sender} authorized and recorded.`,
        sentReply: replyText
      });
    } catch (err) {
      console.error('approveAndSendReply error:', err);
      res.status(500).json({ error: 'Failed to authorize and send reply.' });
    }
  },

  summarizeEmails(req, res) {
    try {
      const emails = dbHelper.all(`
        SELECT * FROM emails
        WHERE user_id = ?
        ORDER BY received_at DESC
      `, [req.user.id]);

      const total = emails.length;
      const highUrgency = emails.filter(e => e.urgency === 'High');
      const needingApproval = emails.filter(e => e.requires_approval === 1);
      const logistics = emails.filter(e => e.category === 'Delivery/Logistics');
      const complaints = emails.filter(e => e.category === 'Complaint');
      const orderQueries = emails.filter(e => e.category === 'Order Inquiry');

      const summaryText = `Total Emails: ${total} | High Urgency: ${highUrgency.length} | Requiring Owner Approval: ${needingApproval.length}.
Breakdown: ${orderQueries.length} order inquiries, ${logistics.length} transit/delivery notices, ${complaints.length} customer issues/complaints.`;

      const actionRecommendations = [
        ...needingApproval.map(e => `[Approval Required] ${e.sender_name}: ${e.subject}`),
        ...highUrgency.filter(e => !e.requires_approval).map(e => `[Priority Action] ${e.sender_name}: ${e.subject}`)
      ];

      res.json({
        summaryText,
        total,
        highUrgencyCount: highUrgency.length,
        needingApprovalCount: needingApproval.length,
        actionRecommendations,
        recentEmails: emails.slice(0, 5)
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate email summary.' });
    }
  }
};
