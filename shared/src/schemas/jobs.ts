import { z } from 'zod';

import { jobTaxonomy } from '../taxonomy.js';
import { gccCountryNames } from './stats.js';

const jobFieldIds = new Set(jobTaxonomy.fields.map((field) => field.id));

export const jobCountrySchema = z.enum(gccCountryNames);
export const jobFieldIdSchema = z
  .string()
  .refine((field) => jobFieldIds.has(field), 'Unknown job field.');

const secureUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Source URLs must use HTTPS.',
  });

export const jobListingSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(120),
    country: jobCountrySchema,
    city: z.string().trim().min(1).max(80),
    field: jobFieldIdSchema,
    source: z.string().trim().min(1).max(80),
    sourceUrl: secureUrlSchema.nullable(),
    isSample: z.boolean(),
    fetchedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine((job, context) => {
    if (job.isSample && (job.source !== 'Sample listing' || job.sourceUrl !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sample listings must use the sample source label and no source URL.',
        path: ['source'],
      });
    }

    if (!job.isSample && (job.source === 'Sample listing' || job.sourceUrl === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Authorized listings require an honest source and HTTPS URL.',
        path: ['sourceUrl'],
      });
    }
  });

export const jobsProvenanceSchema = z
  .object({
    kind: z.enum(['sample', 'authorized']),
    source: z.string().trim().min(1).max(120),
    isStale: z.boolean(),
    notice: z.string().trim().min(1).max(240),
  })
  .strict();

export const jobsResponseSchema = z
  .object({
    items: z.array(jobListingSchema),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    lastUpdated: z.string().datetime({ offset: true }),
    provenance: jobsProvenanceSchema,
  })
  .strict()
  .superRefine((response, context) => {
    if (response.items.length > response.limit || response.items.length > response.total) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page item counts are inconsistent.',
        path: ['items'],
      });
    }

    if (response.totalPages !== Math.ceil(response.total / response.limit)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total pages do not match total and limit.',
        path: ['totalPages'],
      });
    }

    if (new Set(response.items.map((job) => job.id)).size !== response.items.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Job IDs must be unique within a response.',
        path: ['items'],
      });
    }
  });

export type JobListing = z.infer<typeof jobListingSchema>;
export type JobsProvenance = z.infer<typeof jobsProvenanceSchema>;
export type JobsResponse = z.infer<typeof jobsResponseSchema>;
