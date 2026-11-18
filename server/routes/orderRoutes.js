import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.put('/:orderId/status', orderController.updateStatus);

export default router;
