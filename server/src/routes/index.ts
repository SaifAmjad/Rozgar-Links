import { Router } from 'express';

import { createApplicationsRouter, type ApplicationsRouterOptions } from './applications.js';
import { healthRouter } from './health.js';
import { jobsRouter } from './jobs.js';
import { publicConfigRouter } from './publicConfig.js';
import { statsRouter } from './stats.js';
import { taxonomyRouter } from './taxonomy.js';

export interface ApiRouterOptions {
  applications?: ApplicationsRouterOptions;
}

export function createApiRouter(options: ApiRouterOptions = {}) {
  const apiRouter = Router();

  apiRouter.use('/applications', createApplicationsRouter(options.applications));
  apiRouter.use('/config/public', publicConfigRouter);
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/jobs', jobsRouter);
  apiRouter.use('/stats', statsRouter);
  apiRouter.use('/taxonomy', taxonomyRouter);

  return apiRouter;
}
