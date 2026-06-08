import { Router, type Request, type Response } from 'express';

export function healthRoutes(router: Router): void {
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
}