import express from 'express';
import { approvalController } from '../controllers/approvalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', approvalController.getApprovals);
router.post('/:approvalId/approve', approvalController.approveAction);
router.post('/:approvalId/reject', approvalController.rejectAction);

export default router;
