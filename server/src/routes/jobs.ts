import { Router, type Response } from 'express';
import { z } from 'zod';

import { jobCountrySchema, jobFieldIdSchema } from '@rozgar-links/shared';

import { jobsService } from '../services/jobsRuntime.js';
import { JobsUnavailableError, type JobsService } from '../services/jobsService.js';

const optionalQueryString = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const positiveIntegerQuery = (fallback: string, maximum?: number) => {
  let numberSchema = z.number().int().min(1);
  if (maximum !== undefined) numberSchema = numberSchema.max(maximum);

  return z.string().regex(/^\d+$/).transform(Number).pipe(numberSchema).default(fallback);
};

const jobsQuerySchema = z
  .object({
    country: optionalQueryString(jobCountrySchema),
    field: optionalQueryString(jobFieldIdSchema),
    q: optionalQueryString(z.string().trim().min(1).max(80)),
    page: positiveIntegerQuery('1'),
    limit: positiveIntegerQuery('12', 50),
  })
  .strict();

function unavailableResponse(response: Response) {
  return response.status(503).json({
    success: false,
    error: {
      code: 'JOBS_UNAVAILABLE',
      message: 'The job catalog is temporarily unavailable.',
    },
  });
}

export function createJobsRouter(service: JobsService) {
  const router = Router();

  router.get('/', async (request, response) => {
    const query = jobsQuerySchema.safeParse(request.query);

    if (!query.success) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Job filters or pagination values are invalid.',
        },
      });
    }

    try {
      return response.json(await service.getJobs(query.data));
    } catch (error) {
      if (error instanceof JobsUnavailableError) return unavailableResponse(response);
      return unavailableResponse(response);
    }
  });

  return router;
}

export const jobsRouter = createJobsRouter(jobsService);
