import { Router, type Response } from 'express';
import { jobsSortSchema, salaryBandIdSchema } from '@rozgar-links/shared';
import { z } from 'zod';

import { DIRECTORY_CATEGORY_IDS, DIRECTORY_COUNTRY_IDS } from '../jobs/occupationDirectory.js';
import { jobsService } from '../services/jobsRuntime.js';
import { JobsUnavailableError, type JobsService } from '../services/jobsService.js';

const optionalQueryString = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const positiveIntegerQuery = (fallback: string, maximum?: number) => {
  let numberSchema = z.number().int().min(1);
  if (maximum !== undefined) numberSchema = numberSchema.max(maximum);
  return z.string().regex(/^\d+$/).transform(Number).pipe(numberSchema).default(fallback);
};

const optionalSalaryValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100_000)).optional(),
);

const salaryBandsQuery = z
  .string()
  .max(120)
  .transform((value) => (value ? value.split(',') : []))
  .pipe(z.array(salaryBandIdSchema).max(4))
  .default('');

const jobsQuerySchema = z
  .object({
    category: optionalQueryString(z.enum(DIRECTORY_CATEGORY_IDS)),
    country: optionalQueryString(z.enum(DIRECTORY_COUNTRY_IDS)),
    customMax: optionalSalaryValue,
    customMin: optionalSalaryValue,
    designation: optionalQueryString(
      z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(100),
    ),
    language: z.enum(['en', 'ur']).default('en'),
    limit: positiveIntegerQuery('12', 50),
    page: positiveIntegerQuery('1'),
    q: optionalQueryString(z.string().trim().min(1).max(100)),
    salary: salaryBandsQuery,
    sort: jobsSortSchema.default('directory-order'),
  })
  .strict()
  .superRefine((query, context) => {
    if (
      query.customMin !== undefined &&
      query.customMax !== undefined &&
      query.customMin > query.customMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom minimum salary must not exceed the maximum.',
        path: ['customMin'],
      });
    }
  });

function unavailableResponse(response: Response) {
  return response.status(503).json({
    success: false,
    error: {
      code: 'JOBS_UNAVAILABLE',
      message: 'The occupation directory is temporarily unavailable.',
    },
  });
}

export function createJobsRouter(service: JobsService) {
  const router = Router();

  router.get('/', async (request, response) => {
    const parsed = jobsQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Occupation filters, sorting or pagination values are invalid.',
        },
      });
    }

    const { salary, ...query } = parsed.data;

    try {
      return response.json(
        await service.getJobs({
          language: query.language,
          limit: query.limit,
          page: query.page,
          salaryBands: salary,
          sort: query.sort,
          ...(query.category ? { category: query.category } : {}),
          ...(query.country ? { country: query.country } : {}),
          ...(query.customMax !== undefined ? { customMax: query.customMax } : {}),
          ...(query.customMin !== undefined ? { customMin: query.customMin } : {}),
          ...(query.designation ? { designation: query.designation } : {}),
          ...(query.q ? { q: query.q } : {}),
        }),
      );
    } catch (error) {
      if (error instanceof JobsUnavailableError) return unavailableResponse(response);
      return unavailableResponse(response);
    }
  });

  return router;
}

export const jobsRouter = createJobsRouter(jobsService);
