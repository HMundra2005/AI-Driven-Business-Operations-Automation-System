import express from 'express';
import { taskController } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:taskId/toggle', taskController.toggleTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;
