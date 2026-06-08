import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loadConfig } from './config/index.js';

const app = express();

try {
  loadConfig();
} catch (error) {
  console.error('Failed to load config, exiting...');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Health check at /health (not under /api)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

const apiRouter = routes();
app.use('/api', apiRouter);

app.use(errorHandler);

export default app;