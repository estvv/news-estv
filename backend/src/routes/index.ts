import { Router } from 'express';
import { healthRoutes } from './health.js';
import { papersRoutes } from './papers.js';

export default function routes(): Router {
  const router = Router();
  
  healthRoutes(router);
  papersRoutes(router);
  
  return router;
}