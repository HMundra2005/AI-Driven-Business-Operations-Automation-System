import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CONFIG } from './config.js';
import { initDatabase } from './db/database.js';
import { seedDemoData } from './db/seed.js';
import { startEmailWorker } from './services/emailWorker.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database & Seed initial demonstration dataset
initDatabase();
const demoUserId = seedDemoData();
console.log(`[Database] Initialized and verified demo user account (${demoUserId}).`);

// Start Automated Background Email Processor
startEmailWorker();
console.log('[EmailWorker] Automated background processing service started.');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    demoAccount: 'demo@opsautomate.com',
    engine: 'SQLite3 (node:sqlite native)',
    backgroundWorker: 'active'
  });
});

app.listen(CONFIG.PORT, () => {
  console.log(`[Server] Business Operations API running on http://localhost:${CONFIG.PORT}`);
});
