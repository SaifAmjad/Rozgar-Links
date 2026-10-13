import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { jobListingSchema, type JobListing } from '@rozgar-links/shared';
import { z } from 'zod';

import type { JobProvider } from './JobProvider.js';

const sampleSeedEntrySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    country: z.string(),
    city: z.string(),
    field: z.string(),
    source: z.literal('Sample listing'),
    sourceUrl: z.null(),
    isSample: z.literal(true),
  })
  .strict();

const sampleSeedSchema = z
  .array(sampleSeedEntrySchema)
  .length(40)
  .superRefine((jobs, context) => {
    if (new Set(jobs.map((job) => job.id)).size !== jobs.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sample job IDs must be unique.',
      });
    }
  });

const defaultSeedFile = fileURLToPath(new URL('../../data/jobs.seed.json', import.meta.url));

export class ManualProvider implements JobProvider {
  readonly descriptor = {
    id: 'manual-sample-catalog',
    kind: 'sample' as const,
    label: 'Fictional sample catalog',
  };

  constructor(
    private readonly filePath = defaultSeedFile,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async fetchJobs(): Promise<JobListing[]> {
    const serialized = await readFile(this.filePath, 'utf8');
    const seed = sampleSeedSchema.parse(JSON.parse(serialized));
    const fetchedAt = this.now().toISOString();

    return z.array(jobListingSchema).parse(seed.map((job) => ({ ...job, fetchedAt })));
  }
}
