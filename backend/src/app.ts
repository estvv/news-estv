import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
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

app.set('trust proxy', 2);

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

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