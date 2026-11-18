import express from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/products', inventoryController.getProducts);
router.post('/products', inventoryController.addProduct);
router.put('/products/:productId/stock', inventoryController.updateStock);
router.get('/shortages', inventoryController.getShortages);
router.post('/replenish', inventoryController.draftReplenishmentPO);

export default router;
