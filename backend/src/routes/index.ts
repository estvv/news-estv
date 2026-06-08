import { Router } from 'express';
import { papersRoutes } from './papers.js';

export default function routes(): Router {
  const router = Router();
  
  papersRoutes(router);
  
  return router;
}