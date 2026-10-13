import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';

import { applicationFieldsSchema, type ApplicationFields } from '@rozgar-links/shared';

import { env } from '../config/env.js';
import {
  AdminDeliveryError,
  deliverApplication,
  type ApplicationDeliveryInput,
  type ApplicationDeliveryResult,
} from '../email/applicationEmail.js';
import { SmtpUnavailableError } from '../email/transport.js';
import { HttpError } from '../errors/httpError.js';
import { getValidatedApplicationFiles, uploadApplication } from '../middleware/upload.js';
import { createApplicationReference } from '../services/applicationReference.js';
import {
  writeApplicationAuditEvent,
  type ApplicationAuditLogger,
} from '../services/applicationAudit.js';

export interface ApplicationsRouterOptions {
  audit?: ApplicationAuditLogger;
  deliver?: (input: ApplicationDeliveryInput) => Promise<ApplicationDeliveryResult>;
  enabled?: boolean;
  rateLimitMax?: number;
}

function parseApplicationFields(value: unknown): ApplicationFields {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_fields', 'The application fields are required.');
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(value);
  } catch {
    throw new HttpError(400, 'invalid_fields', 'The application fields are invalid JSON.');
  }

  const result = applicationFieldsSchema.safeParse(decoded);
  if (!result.success) {
    throw new HttpError(
      400,
      'validation_failed',
      'The application contains invalid fields.',
      result.error.flatten().fieldErrors,
    );
  }
  return result.data;
}

export function createApplicationsRouter(options: ApplicationsRouterOptions = {}) {
  const router = Router();
  const audit = options.audit ?? writeApplicationAuditEvent;
  const deliver = options.deliver ?? deliverApplication;
  const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1_000,
    limit: options.rateLimitMax ?? env.APPLICATION_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({
        success: false,
        error: { code: 'rate_limited', message: 'Too many applications. Please try again later.' },
      });
    },
  });

  router.use((_request, response, next) => {
    const requestId = randomUUID();
    response.setHeader('X-Request-Id', requestId);
    response.once('finish', () => {
      audit({
        event:
          response.statusCode === 201
            ? 'application_admin_delivery_accepted'
            : 'application_request_rejected',
        requestId,
        status: response.statusCode,
        timestamp: new Date().toISOString(),
      });
    });
    next();
  });

  if (options.enabled === false) {
    router.post('/', (_request, response) => {
      response.status(503).json({
        success: false,
        error: {
          code: 'demo_submission_disabled',
          message: 'Application submission is disabled in this hosted demo. No data was accepted.',
        },
      });
    });
    return router;
  }

  router.post('/', applicationLimiter, uploadApplication, async (request, response, next) => {
    try {
      const bodyKeys = Object.keys(request.body as Record<string, unknown>);
      if (bodyKeys.some((key) => !['fields', 'website'].includes(key))) {
        throw new HttpError(400, 'invalid_fields', 'Unexpected application fields were provided.');
      }
      if (typeof request.body.website === 'string' && request.body.website.trim()) {
        throw new HttpError(400, 'validation_failed', 'The application could not be accepted.');
      }

      const application = parseApplicationFields(request.body.fields);
      const files = getValidatedApplicationFiles(request);
      const referenceId = createApplicationReference();
      const delivery = await deliver({ application, files, referenceId });

      response.status(201).json({
        success: true,
        referenceId,
        confirmationEmailSent: delivery.confirmationEmailSent,
      });
    } catch (error) {
      if (error instanceof SmtpUnavailableError) {
        next(new HttpError(503, 'email_unavailable', 'Application email is not configured.'));
        return;
      }
      if (error instanceof AdminDeliveryError) {
        next(new HttpError(502, 'email_delivery_failed', 'Application email was not accepted.'));
        return;
      }
      next(error);
    }
  });

  return router;
}
