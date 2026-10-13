import { healthResponseSchema } from '@rozgar-links/shared';
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json(healthResponseSchema.parse({ status: 'ok' }));
});
