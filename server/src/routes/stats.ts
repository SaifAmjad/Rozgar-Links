import { Router, type Response } from 'express';
import { z } from 'zod';

import { statsService } from '../services/statsRuntime.js';
import { StatsUnavailableError, type StatsService } from '../services/statsService.js';

const historyQuerySchema = z
  .object({
    days: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(30))
      .default('7'),
  })
  .strict();

function unavailableResponse(response: Response) {
  return response.status(503).json({
    success: false,
    error: {
      code: 'STATS_UNAVAILABLE',
      message: 'Statistics are temporarily unavailable.',
    },
  });
}

export function createStatsRouter(service: StatsService) {
  const router = Router();

  router.get('/', async (_request, response) => {
    try {
      response.json(await service.ensureToday());
    } catch (error) {
      if (error instanceof StatsUnavailableError) return unavailableResponse(response);
      return unavailableResponse(response);
    }
  });

  router.get('/history', async (request, response) => {
    const query = historyQuerySchema.safeParse(request.query);

    if (!query.success) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Days must be a whole number from 1 to 30.',
        },
      });
    }

    try {
      return response.json(await service.getHistory(query.data.days));
    } catch (error) {
      if (error instanceof StatsUnavailableError) return unavailableResponse(response);
      return unavailableResponse(response);
    }
  });

  return router;
}

export const statsRouter = createStatsRouter(statsService);
