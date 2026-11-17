import { Router, type CookieOptions, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLoginSchema } from '@rozgar-links/shared';
import { env } from '../config/env.js';
import { HttpError } from '../errors/httpError.js';
import { constantTimeTextEqual, verifyAdminPassword } from '../admin/password.js';
import {
  createAdminSession,
  readAdminSession,
  getSessionCookie,
  adminSessionLifetimeSeconds,
  type AdminConfiguration,
} from '../admin/session.js';
import { adminPdfUpload } from '../admin/upload.js';
import { validateUploadedFile } from '../middleware/fileInspection.js';
import { issueCv } from '../services/cvIssuance.js';

export interface AdminRouterOptions {
  configuration?: AdminConfiguration | null;
  now?: () => number;
  loginLimit?: number;
  allowedOrigins: ReadonlySet<string>;
}

export const adminNoCache: RequestHandler = (_request, response, next) => {
  response.set({
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'Surrogate-Control': 'no-store',
  });
  next();
};

export function createAdminRouter(options: AdminRouterOptions) {
  const router = Router();
  const configuration =
    options.configuration === undefined
      ? env.ADMIN_USERNAME &&
        env.ADMIN_PASSWORD_HASH &&
        env.ADMIN_SESSION_SECRET &&
        env.CV_SIGNING_SECRET
        ? {
            username: env.ADMIN_USERNAME,
            passwordHash: env.ADMIN_PASSWORD_HASH,
            sessionSecret: env.ADMIN_SESSION_SECRET,
            cvSigningSecret: env.CV_SIGNING_SECRET,
          }
        : null
      : options.configuration;
  const now = options.now ?? Date.now;
  const secure = env.NODE_ENV === 'production';
  const cookieName = secure ? '__Host-rozgar-admin' : 'rozgar-admin';
  const cookieOptions: CookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/' };
  const maxUploadBytes =
    Math.min(env.MAX_FILE_MB, process.env.VERCEL === '1' ? 4 : 5) * 1024 * 1024;
  router.use(adminNoCache);
  router.use((_request, _response, next) => {
    if (!configuration)
      next(new HttpError(503, 'admin_unavailable', 'Admin access is not configured.'));
    else next();
  });
  // Exact Origin + a non-simple header also protect login against login CSRF.
  router.use((request, _response, next) => {
    if (request.method === 'GET' || request.method === 'HEAD') {
      next();
      return;
    }
    if (
      !options.allowedOrigins.has(request.get('origin') ?? '') ||
      request.get('x-admin-request') !== '1'
    ) {
      next(new HttpError(403, 'admin_origin_rejected', 'This admin request is not allowed.'));
      return;
    }
    next();
  });
  const requireSession: RequestHandler = (request, response, next) => {
    const session =
      configuration &&
      readAdminSession(getSessionCookie(request.headers.cookie, cookieName), configuration, now());
    if (!session) {
      response.clearCookie(cookieName, cookieOptions);
      next(new HttpError(401, 'admin_unauthenticated', 'Please log in to continue.'));
      return;
    }
    if (
      request.method === 'POST' &&
      !constantTimeTextEqual(request.get('x-csrf-token') ?? '', session.csrfToken)
    ) {
      next(
        new HttpError(
          403,
          'admin_csrf_rejected',
          'Your session could not be confirmed. Reload and try again.',
        ),
      );
      return;
    }
    response.locals.adminSession = session;
    next();
  };

  router.post(
    '/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: options.loginLimit ?? 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler(_request, response) {
        response.status(429).json({
          success: false,
          error: {
            code: 'rate_limited',
            message: 'Too many login attempts. Try again in 15 minutes.',
          },
        });
      },
    }),
    (request, response, next) => {
      void (async () => {
        const credentials = adminLoginSchema.safeParse(request.body);
        if (!request.is('application/json') || !credentials.success)
          throw new HttpError(400, 'invalid_admin_login', 'Enter your username and password.');
        // Always perform the same expensive password check, including for unknown usernames.
        const passwordValid = await verifyAdminPassword(
          credentials.data.password,
          configuration!.passwordHash,
        );
        const usernameValid = constantTimeTextEqual(
          credentials.data.username,
          configuration!.username,
        );
        if (!passwordValid || !usernameValid)
          throw new HttpError(401, 'invalid_credentials', 'Invalid username or password.');
        const session = createAdminSession(configuration!, now());
        response.cookie(cookieName, session.cookie, {
          ...cookieOptions,
          maxAge: adminSessionLifetimeSeconds * 1000,
        });
        response.json({
          authenticated: true,
          csrfToken: session.csrfToken,
          expiresAt: new Date(session.payload.expiresAt * 1000).toISOString(),
          maxUploadBytes,
        });
      })().catch(next);
    },
  );
  router.get('/session', requireSession, (_request, response) => {
    const session = response.locals.adminSession as NonNullable<
      ReturnType<typeof readAdminSession>
    >;
    response.json({
      authenticated: true,
      csrfToken: session.csrfToken,
      expiresAt: new Date(session.payload.expiresAt * 1000).toISOString(),
      maxUploadBytes,
    });
  });
  router.post('/logout', requireSession, (_request, response) => {
    response.clearCookie(cookieName, cookieOptions);
    response.json({ authenticated: false });
  });
  router.post(
    '/cv/issue',
    requireSession,
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler(_request, response) {
        response.status(429).json({
          success: false,
          error: {
            code: 'rate_limited',
            message: 'Too many issuance requests. Please try again later.',
          },
        });
      },
    }),
    adminPdfUpload(maxUploadBytes),
    (request, response, next) => {
      void (async () => {
        try {
          if (!request.file || Object.keys(request.body ?? {}).length)
            throw new HttpError(400, 'invalid_upload', 'Upload one completed PDF CV only.');
          const file = validateUploadedFile('cv', request.file);
          if (file.mimeType !== 'application/pdf')
            throw new HttpError(400, 'invalid_upload', 'Upload one completed PDF CV only.');
          const issued = await issueCv(file.buffer, configuration!.cvSigningSecret, maxUploadBytes);
          response.set({
            'X-CV-Reference': issued.reference,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${issued.reference}.pdf"`,
          });
          response.send(issued.pdf);
        } catch (error) {
          next(
            error instanceof HttpError
              ? error
              : new HttpError(
                  400,
                  'invalid_cv',
                  'Use a valid, unencrypted, unsigned PDF with 1–100 pages within the size limit.',
                ),
          );
        } finally {
          delete request.file;
        }
      })().catch(next);
    },
  );
  return router;
}
