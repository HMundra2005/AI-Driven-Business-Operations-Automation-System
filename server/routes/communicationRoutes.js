import express from 'express';
import { communicationController } from '../controllers/communicationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', communicationController.getEmails);
router.post('/simulate', communicationController.simulateIncoming);
router.post('/process', communicationController.triggerProcessing);
router.put('/:emailId/read', communicationController.markRead);
router.post('/:emailId/reply', communicationController.approveAndSendReply);
router.get('/summary', communicationController.summarizeEmails);

export default router;
