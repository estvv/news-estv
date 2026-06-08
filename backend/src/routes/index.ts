import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { papersRoutes } from './papers.js';
import authRoutes from './auth.js';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many login attempts' }
});

export default function routes(): Router {
  const router = Router();
  
  router.use('/auth', loginLimiter, authRoutes);
  papersRoutes(router);
  
  return router;
}