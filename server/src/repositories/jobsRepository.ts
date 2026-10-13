import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jobListingSchema } from '@rozgar-links/shared';
import { z } from 'zod';

const jobsCacheSchema = z
  .object({
    version: z.literal(1),
    provider: z
      .object({
        id: z.string().trim().min(1).max(80),
        kind: z.enum(['sample', 'authorized']),
        label: z.string().trim().min(1).max(120),
      })
      .strict(),
    refreshedAt: z.string().datetime({ offset: true }),
    jobs: z.array(jobListingSchema).max(500),
  })
  .strict()
  .superRefine((cache, context) => {
    if (new Set(cache.jobs.map((job) => job.id)).size !== cache.jobs.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cached job IDs must be unique.',
        path: ['jobs'],
      });
    }
  });

export type JobsCache = z.infer<typeof jobsCacheSchema>;

export interface JobsCacheResult {
  cache: JobsCache | undefined;
  recoveredFromMemory: boolean;
}

const defaultCacheFile = fileURLToPath(new URL('../../data/jobs.cache.json', import.meta.url));

export class JobsRepository {
  private lastValidCache: JobsCache | undefined;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = defaultCacheFile) {}

  async read(): Promise<JobsCacheResult> {
    await this.writeQueue;
    return this.readWithoutWaiting();
  }

  async save(cache: JobsCache) {
    const validatedCache = jobsCacheSchema.parse(cache);
    const write = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        const directory = dirname(this.filePath);
        const temporaryFile = `${directory}/.${basename(this.filePath)}.${process.pid}.tmp`;

        await mkdir(directory, { recursive: true });

        try {
          await writeFile(temporaryFile, `${JSON.stringify(validatedCache, null, 2)}\n`, {
            encoding: 'utf8',
            mode: 0o600,
          });
          await rename(temporaryFile, this.filePath);
          this.lastValidCache = structuredClone(validatedCache);
        } finally {
          await rm(temporaryFile, { force: true });
        }
      });

    this.writeQueue = write.catch(() => undefined);
    await write;
  }

  private async readWithoutWaiting(): Promise<JobsCacheResult> {
    try {
      const serialized = await readFile(this.filePath, 'utf8');
      const cache = jobsCacheSchema.parse(JSON.parse(serialized));
      this.lastValidCache = structuredClone(cache);
      return { cache, recoveredFromMemory: false };
    } catch (error) {
      if (this.lastValidCache) {
        return { cache: structuredClone(this.lastValidCache), recoveredFromMemory: true };
      }

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { cache: undefined, recoveredFromMemory: false };
      }

      return { cache: undefined, recoveredFromMemory: false };
    }
  }
}
