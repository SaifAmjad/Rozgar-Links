import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { HttpError } from './errors/httpError.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter, type ApiRouterOptions } from './routes/index.js';

export function createApp(options: ApiRouterOptions = {}) {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY_HOPS > 0) app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(
    cors({
      methods: ['GET', 'POST'],
      origin(origin, callback) {
        if (!origin || origin === env.CLIENT_URL) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, 'origin_not_allowed', 'This origin is not allowed.'));
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createApiRouter(options));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
