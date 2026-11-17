import { Router } from 'express';

import { env } from '../config/env.js';
import { createApplicationsRouter, type ApplicationsRouterOptions } from './applications.js';
import { healthRouter } from './health.js';
import { createJobsRouter } from './jobs.js';
import { createPublicConfigRouter } from './publicConfig.js';
import { createStatsRouter } from './stats.js';
import { taxonomyRouter } from './taxonomy.js';
import { createCvRouter } from './cv.js';
import { createAdminRouter, type AdminRouterOptions } from './admin.js';
import { jobsService as defaultJobsService } from '../services/jobsRuntime.js';
import type { JobsService } from '../services/jobsService.js';
import { statsService as defaultStatsService } from '../services/statsRuntime.js';
import type { StatsService } from '../services/statsService.js';

export interface ApiRouterOptions {
  admin?: Partial<AdminRouterOptions>;
  applications?: ApplicationsRouterOptions;
  applicationSubmissionEnabled?: boolean;
  jobsService?: JobsService;
  statsService?: StatsService;
}

export function createApiRouter(options: ApiRouterOptions = {}) {
  const apiRouter = Router();

  const applicationSubmissionEnabled =
    options.applicationSubmissionEnabled ?? env.APPLICATION_SUBMISSION_ENABLED;
  const applicationOptions = {
    ...options.applications,
    enabled: applicationSubmissionEnabled,
  };

  apiRouter.use('/applications', createApplicationsRouter(applicationOptions));
  apiRouter.use('/cv', createCvRouter());
  apiRouter.use(
    '/admin',
    createAdminRouter({
      ...options.admin,
      allowedOrigins: options.admin?.allowedOrigins ?? new Set([new URL(env.CLIENT_URL).origin]),
    }),
  );
  apiRouter.use('/config/public', createPublicConfigRouter(applicationSubmissionEnabled));
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/jobs', createJobsRouter(options.jobsService ?? defaultJobsService));
  apiRouter.use('/stats', createStatsRouter(options.statsService ?? defaultStatsService));
  apiRouter.use('/taxonomy', taxonomyRouter);

  return apiRouter;
}
