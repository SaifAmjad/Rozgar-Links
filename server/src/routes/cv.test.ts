import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { createCvReference, signIssuedCv } from '../services/cvIdentity.js';

const pdf = Buffer.from('%PDF-1.7\nTest CV only\n%%EOF\n');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const fields = {
  firstName: 'Test',
  lastName: 'Applicant',
  email: 'test@example.invalid',
  phone: '03001234567',
  field: 'construction',
  countries: ['qatar'],
  selectedJobIds: ['occupation-001'],
  cvPathType: 'existing_rozgar_cv',
};
const previous = env.CV_SIGNING_SECRET;
beforeEach(() => {
  env.CV_SIGNING_SECRET = randomBytes(32).toString('hex');
});
afterEach(() => {
  env.CV_SIGNING_SECRET = previous;
});

describe('official CV verification API and final submission', () => {
  it('returns only a reference for valid PDFs, and generic failure for legacy/modified documents', async () => {
    const app = createApp();
    const reference = createCvReference();
    const issued = signIssuedCv(pdf, reference);
    const valid = await request(app).post('/api/cv/verify').attach('cv', issued, 'issued.pdf');
    expect(valid.status).toBe(200);
    expect(valid.body).toEqual({ valid: true, cvReference: reference });
    expect(valid.headers['cache-control']).toBe('no-store');
    const legacy = await request(app).post('/api/cv/verify').attach('cv', pdf, 'legacy.pdf');
    expect(legacy.body).toEqual({ valid: false, message: expect.any(String) });
    const changed = Buffer.from(issued);
    changed[15] = 88;
    const invalid = await request(app).post('/api/cv/verify').attach('cv', changed, 'issued.pdf');
    expect(invalid.body.valid).toBe(false);
  });
  it('rejects missing, extra, spoofed and non-PDF uploads and fields', async () => {
    const app = createApp();
    for (const pending of [
      request(app).post('/api/cv/verify'),
      request(app)
        .post('/api/cv/verify')
        .attach('cv', png, { filename: 'cv.pdf', contentType: 'application/pdf' }),
      request(app).post('/api/cv/verify').attach('paymentScreenshot', png, 'payment.png'),
      request(app).post('/api/cv/verify').field('verified', 'true').attach('cv', pdf, 'cv.pdf'),
      request(app)
        .post('/api/cv/verify')
        .attach('cv', pdf, 'cv.pdf')
        .attach('cv', pdf, 'second.pdf'),
    ]) {
      expect((await pending).status).toBe(400);
    }
  });
  it('fails safely when verification is unconfigured and limits verification attempts', async () => {
    env.CV_SIGNING_SECRET = undefined;
    const app = createApp();
    const unavailable = await request(app).post('/api/cv/verify').attach('cv', pdf, 'cv.pdf');
    expect(unavailable.status).toBe(503);
    for (let index = 0; index < 19; index++) await request(app).post('/api/cv/verify');
    expect((await request(app).post('/api/cv/verify')).status).toBe(429);
  });
  it('independently verifies the attachment and passes the official reference to one admin delivery', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, audit: vi.fn(), rateLimitMax: 100 },
    });
    const reference = createCvReference();
    const issued = signIssuedCv(pdf, reference);
    const response = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(fields))
      .attach('cv', issued, 'official.pdf');
    expect(response.status).toBe(201);
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver.mock.calls[0]?.[0]).toMatchObject({
      cvReference: reference,
      files: { cv: { buffer: issued } },
    });
    expect(deliver.mock.calls[0]?.[0].files).not.toHaveProperty('paymentScreenshot');
  });
  it('rejects payment bypass, contradictory attachments and invalid job selections before email', async () => {
    const deliver = vi.fn();
    const app = createApp({
      applicationSubmissionEnabled: true,
      applications: { deliver, audit: vi.fn(), rateLimitMax: 100 },
    });
    const issued = signIssuedCv(pdf, createCvReference());
    const payloads = [
      { ...fields, verified: true },
      { ...fields, selectedJobIds: [] },
      {
        ...fields,
        selectedJobIds: ['occupation-001', 'occupation-002', 'occupation-003', 'occupation-004'],
      },
      { ...fields, selectedJobIds: ['occupation-001', 'occupation-001'] },
      { ...fields, selectedJobIds: ['occupation-999'] },
      { ...fields, selectedJobIds: ['occupation-058'] },
    ];
    for (const payload of payloads) {
      const response = await request(app)
        .post('/api/applications')
        .field('fields', JSON.stringify(payload))
        .attach('cv', issued, 'cv.pdf');
      expect(response.status).toBe(400);
    }
    const legacy = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(fields))
      .attach('cv', pdf, 'cv.pdf');
    expect(legacy.status).toBe(400);
    const extraPayment = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(fields))
      .attach('cv', issued, 'cv.pdf')
      .attach('paymentScreenshot', png, 'payment.png');
    expect(extraPayment.status).toBe(400);
    const missing = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify(fields));
    expect(missing.status).toBe(400);
    const newWithCv = await request(app)
      .post('/api/applications')
      .field('fields', JSON.stringify({ ...fields, cvPathType: 'new_cv_required' }))
      .attach('cv', issued, 'cv.pdf')
      .attach('paymentScreenshot', png, 'payment.png');
    expect(newWithCv.status).toBe(400);
    expect(deliver).not.toHaveBeenCalled();
  });
});
