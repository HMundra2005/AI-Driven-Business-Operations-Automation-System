import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/summary', dashboardController.getSummaryMetrics);
router.get('/widgets', dashboardController.getWidgetsData);
router.get('/layout', dashboardController.getLayout);
router.post('/layout', dashboardController.saveLayout);

export default router;
