import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.post('/chat', aiController.chat);
router.get('/tools', aiController.getTools);

export default router;
