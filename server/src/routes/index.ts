import { Router } from 'express';

import { createApplicationsRouter, type ApplicationsRouterOptions } from './applications.js';
import { healthRouter } from './health.js';
import { createJobsRouter } from './jobs.js';
import { createPublicConfigRouter } from './publicConfig.js';
import { createStatsRouter } from './stats.js';
import { taxonomyRouter } from './taxonomy.js';
import { jobsService as defaultJobsService } from '../services/jobsRuntime.js';
import type { JobsService } from '../services/jobsService.js';
import { statsService as defaultStatsService } from '../services/statsRuntime.js';
import type { StatsService } from '../services/statsService.js';

export interface ApiRouterOptions {
  applications?: ApplicationsRouterOptions;
  applicationSubmissionEnabled?: boolean;
  jobsService?: JobsService;
  statsService?: StatsService;
}

export function createApiRouter(options: ApiRouterOptions = {}) {
  const apiRouter = Router();

  const applicationSubmissionEnabled = options.applicationSubmissionEnabled ?? true;
  const applicationOptions = {
    ...options.applications,
    enabled: applicationSubmissionEnabled,
  };

  apiRouter.use('/applications', createApplicationsRouter(applicationOptions));
  apiRouter.use('/config/public', createPublicConfigRouter(applicationSubmissionEnabled));
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/jobs', createJobsRouter(options.jobsService ?? defaultJobsService));
  apiRouter.use('/stats', createStatsRouter(options.statsService ?? defaultStatsService));
  apiRouter.use('/taxonomy', taxonomyRouter);

  return apiRouter;
}
