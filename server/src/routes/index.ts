import { Router } from 'express';

import { healthRouter } from './health.js';
import { jobsRouter } from './jobs.js';
import { publicConfigRouter } from './publicConfig.js';
import { statsRouter } from './stats.js';
import { taxonomyRouter } from './taxonomy.js';

export const apiRouter = Router();

apiRouter.use('/config/public', publicConfigRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/taxonomy', taxonomyRouter);
