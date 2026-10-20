import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import { AdminDeliveryError } from '../email/applicationEmail.js';
import { SmtpUnavailableError } from '../email/transport.js';
import { maximumFileBytes } from '../middleware/upload.js';

const applicationFields = {
  firstName: 'Test',
  lastName: 'Applicant',
  dateOfBirth: '1990-01-01',
  nationalId: '12345-1234567-1',
  email: 'applicant@example.com',
  phone: '03001234567',
  currentCity: 'Lahore',
  countries: ['saudi-arabia'],
  field: 'construction',
  yearsExperience: 4,
};

const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n%%EOF\n');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

function validRequest(
  app: ReturnType<typeof createApp>,
  overrides: { fields?: object; website?: string } = {},
) {
  return request(app)
    .post('/api/applications')
    .field('fields', JSON.stringify(overrides.fields ?? applicationFields))
    .field('website', overrides.website ?? '')
    .attach('cv', pdf, { filename: 'resume.pdf', contentType: 'application/pdf' })
    .attach('paymentScreenshot', png, { filename: 'payment.png', contentType: 'image/png' });
}

describe('POST /api/applications', () => {
  it('returns 201 only after one accepted admin delivery', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const audit = vi.fn();
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { audit, deliver, rateLimitMax: 100 },
    });

    const response = await validRequest(app);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
    });
    expect(response.body.referenceId).toMatch(/^RL-\d{4}-[A-Z2-9]{6}$/);
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver.mock.calls[0]?.[0].files.cv.buffer).toEqual(pdf);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith({
      event: 'application_admin_delivery_accepted',
      requestId: response.headers['x-request-id'],
      status: 201,
      timestamp: expect.any(String),
    });
    const auditJson = JSON.stringify(audit.mock.calls);
    expect(auditJson).not.toContain(applicationFields.email);
    expect(auditJson).not.toContain(applicationFields.nationalId);
  });

  it('rejects missing, unexpected and signature-spoofed uploads', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, rateLimitMax: 100 },
    });

    const missing = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(applicationFields));
    const unexpected = await validRequest(app).attach('unexpected', png, {
      filename: 'extra.png',
      contentType: 'image/png',
    });
    const spoofed = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(applicationFields))
      .attach('cv', png, { filename: 'resume.pdf', contentType: 'application/pdf' })
      .attach('paymentScreenshot', png, { filename: 'payment.png', contentType: 'image/png' });

    expect(missing.status).toBe(400);
    expect(unexpected.status).toBe(400);
    expect(spoofed.status).toBe(400);
    expect(deliver).not.toHaveBeenCalled();
  });

  it('rejects oversized uploads without exposing file content', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, rateLimitMax: 100 },
    });

    const response = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(applicationFields))
      .attach('cv', Buffer.alloc(maximumFileBytes + 1), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .attach('paymentScreenshot', png, { filename: 'payment.png', contentType: 'image/png' });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'request_too_large', message: 'The application upload is too large.' },
    });
    expect(JSON.stringify(response.body)).not.toContain(Buffer.alloc(8).toString('base64'));
  });

  it('rejects invalid fields, unknown text fields and the honeypot', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, rateLimitMax: 100 },
    });

    const invalid = await validRequest(app, {
      fields: { ...applicationFields, firstName: '' },
    });
    const unknown = await validRequest(app).field('extraField', 'not-allowed');
    const honeypot = await validRequest(app, { website: 'https://bot.example' });

    expect(invalid.status).toBe(400);
    expect(invalid.body.error.fieldErrors.firstName).toBeDefined();
    expect(unknown.status).toBe(400);
    expect(honeypot.status).toBe(400);
    expect(deliver).not.toHaveBeenCalled();
  });

  it('never reports success when admin SMTP delivery fails', async () => {
    const deliver = vi.fn().mockRejectedValue(new AdminDeliveryError());
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, rateLimitMax: 100 },
    });

    const response = await validRequest(app);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'email_delivery_failed', message: 'Application email was not accepted.' },
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('returns a safe 503 when SMTP is not configured', async () => {
    const deliver = vi.fn().mockRejectedValue(new SmtpUnavailableError());
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, rateLimitMax: 100 },
    });

    const response = await validRequest(app);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'email_unavailable', message: 'Application email is not configured.' },
    });
  });

  it('rate limits application attempts per app instance', async () => {
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: {
        deliver: vi.fn().mockResolvedValue(undefined),
        rateLimitMax: 2,
      },
    });

    const first = await request(app).post('/api/applications').field('fields', '{}');
    const second = await request(app).post('/api/applications').field('fields', '{}');
    const third = await request(app).post('/api/applications').field('fields', '{}');

    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('rate_limited');
  });
});
