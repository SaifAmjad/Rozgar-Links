import { jobListingSchema } from '@rozgar-links/shared';

import sampleJobs from '../server/data/jobs.seed.json' with { type: 'json' };
import { createApp } from '../server/src/app.js';
import { env } from '../server/src/config/env.js';
import type { JobProvider } from '../server/src/providers/JobProvider.js';
import { MemoryJobsRepository } from '../server/src/repositories/jobsRepository.js';
import { MemoryStatsRepository } from '../server/src/repositories/statsRepository.js';
import { JobsService } from '../server/src/services/jobsService.js';
import { StatsService } from '../server/src/services/statsService.js';

const sampleProvider: JobProvider = {
  descriptor: {
    id: 'vercel-demo-sample-catalog',
    kind: 'sample',
    label: 'Fictional sample catalog',
  },
  async fetchJobs() {
    const fetchedAt = new Date().toISOString();
    return jobListingSchema.array().parse(sampleJobs.map((job) => ({ ...job, fetchedAt })));
  },
};

const app = createApp({
  applicationSubmissionEnabled: false,
  jobsService: new JobsService({
    provider: sampleProvider,
    repository: new MemoryJobsRepository(),
  }),
  statsService: new StatsService({
    repository: new MemoryStatsRepository(),
    timeZone: env.TZ,
  }),
});

export default app;
