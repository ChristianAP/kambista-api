import { Router } from 'express';

export const createHealthRouter = (isDatabaseUp: () => boolean): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ status: 'ok', database: isDatabaseUp() ? 'up' : 'down' });
  });

  return router;
};
