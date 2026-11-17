import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { HttpError } from './errors/httpError.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter, type ApiRouterOptions } from './routes/index.js';
import { adminNoCache } from './routes/admin.js';

const vercelOriginKeys = [
  'VERCEL_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
] as const;

function getAllowedBrowserOrigins() {
  const allowedOrigins = new Set([new URL(env.CLIENT_URL).origin]);

  for (const key of vercelOriginKeys) {
    const hostname = process.env[key]?.trim();
    if (!hostname) continue;

    try {
      const origin = new URL(hostname.includes('://') ? hostname : `https://${hostname}`);
      if (origin.protocol === 'https:' && origin.hostname.endsWith('.vercel.app')) {
        allowedOrigins.add(origin.origin);
      }
    } catch {
      continue;
    }
  }

  return allowedOrigins;
}

export function createApp(options: ApiRouterOptions = {}) {
  const app = express();
  const allowedOrigins = getAllowedBrowserOrigins();
  const trustProxyHops =
    env.TRUST_PROXY_HOPS > 0 ? env.TRUST_PROXY_HOPS : process.env.VERCEL === '1' ? 1 : 0;

  app.disable('x-powered-by');
  if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);
  app.use(helmet());
  app.use('/api/admin', adminNoCache);
  app.use(
    cors({
      credentials: true,
      exposedHeaders: ['X-CV-Reference', 'Content-Disposition'],
      methods: ['GET', 'POST'],
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, 'origin_not_allowed', 'This origin is not allowed.'));
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createApiRouter({ ...options, admin: { ...options.admin, allowedOrigins } }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
