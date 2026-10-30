import type { Request, Response } from 'express';

import occupationSeed from '../server/data/occupations.seed.json' with { type: 'json' };
import { createApp } from '../server/src/app.js';
import { env } from '../server/src/config/env.js';
import { parseOccupationSeed } from '../server/src/jobs/occupationDirectory.js';
import type { JobProvider } from '../server/src/providers/JobProvider.js';
import { MemoryJobsRepository } from '../server/src/repositories/jobsRepository.js';
import { MemoryStatsRepository } from '../server/src/repositories/statsRepository.js';
import { JobsService } from '../server/src/services/jobsService.js';
import { StatsService } from '../server/src/services/statsService.js';

const directoryProvider: JobProvider = {
  descriptor: {
    id: 'vercel-occupation-directory',
    kind: 'directory',
    label: 'Rozgar Link Master GCC Occupations & Salary Directory (2026)',
  },
  async fetchJobs() {
    return parseOccupationSeed(occupationSeed);
  },
};

const app = createApp({
  applicationSubmissionEnabled: env.APPLICATION_SUBMISSION_ENABLED,
  jobsService: new JobsService({
    provider: directoryProvider,
    repository: new MemoryJobsRepository(),
  }),
  statsService: new StatsService({
    repository: new MemoryStatsRepository(),
    timeZone: env.APP_TIME_ZONE,
  }),
});

export function restoreForwardedApiPath(request: Request) {
  const requestUrl = new URL(request.url, 'http://vercel.internal');
  const forwardedPath = requestUrl.searchParams.get('path');

  if (forwardedPath) {
    requestUrl.searchParams.delete('path');
    request.url = `/api/${forwardedPath}${requestUrl.search}`;

    const parsedQuery = request.query as Record<string, unknown> | undefined;
    if (parsedQuery && typeof parsedQuery === 'object') delete parsedQuery.path;
  }
}

export default function handler(request: Request, response: Response) {
  restoreForwardedApiPath(request);

  return app(request, response);
}
