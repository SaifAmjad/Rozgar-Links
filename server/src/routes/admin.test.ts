import { randomBytes } from 'node:crypto';
import { PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminSessionSchema } from '@rozgar-links/shared';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashAdminPassword } from '../admin/password.js';
import { createAdminSession, type AdminConfiguration } from '../admin/session.js';
import { verifyIssuedCv } from '../services/cvIdentity.js';

const origin = 'http://localhost:5173';
const headers = { Origin: origin, 'X-Admin-Request': '1' };
const password = 'Test only administrator password!';
const priorSecret = env.CV_SIGNING_SECRET;
const priorMode = env.NODE_ENV;
let config: AdminConfiguration;
let pdf: Buffer;
beforeAll(async () => {
  config = {
    username: 'test-admin',
    passwordHash: await hashAdminPassword(password),
    sessionSecret: randomBytes(32).toString('hex'),
    cvSigningSecret: randomBytes(32).toString('hex'),
  };
  const document = await PDFDocument.create();
  document.addPage();
  pdf = Buffer.from(await document.save());
});
beforeEach(() => {
  env.CV_SIGNING_SECRET = config.cvSigningSecret;
});
afterEach(() => {
  env.CV_SIGNING_SECRET = priorSecret;
  env.NODE_ENV = priorMode;
  vi.unstubAllEnvs();
});
function authenticatedHeaders(now = Date.now()) {
  const session = createAdminSession(config, now);
  return {
    ...headers,
    Cookie: `rozgar-admin=${session.cookie}`,
    'X-CSRF-Token': session.csrfToken,
  };
}
const app = () => createApp({ admin: { configuration: config } });

describe('protected admin authentication and CV issuance', () => {
  it('accepts correct credentials, uses HttpOnly cookies, and returns only session metadata', async () => {
    const server = app();
    const login = await request(server)
      .post('/api/admin/login')
      .set(headers)
      .send({ username: config.username, password });
    expect(login.status).toBe(200);
    expect(adminSessionSchema.parse(login.body).authenticated).toBe(true);
    expect(login.headers['cache-control']).toBe('no-store');
    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Max-Age=28800/);
    expect(JSON.stringify(login.body)).not.toMatch(/password|secret|test-admin/);
    const session = await request(server).get('/api/admin/session').set('Cookie', cookie);
    expect(session.status).toBe(200);
    expect(session.body).toEqual(login.body);
    const logout = await request(server)
      .post('/api/admin/logout')
      .set(headers)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', session.body.csrfToken)
      .send({});
    expect(logout.status).toBe(200);
    expect(logout.body).toEqual({ authenticated: false });
    expect(logout.headers['set-cookie'][0]).toMatch(/rozgar-admin=;.*Expires=Thu, 01 Jan 1970/);
    expect((await request(server).get('/api/admin/session')).status).toBe(401);
  });
  it('sets the production host-only Secure cookie', async () => {
    env.NODE_ENV = 'production';
    const login = await request(app())
      .post('/api/admin/login')
      .set(headers)
      .send({ username: config.username, password });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).toMatch(/^__Host-rozgar-admin=/);
    expect(login.headers['set-cookie'][0]).toMatch(/; Secure;/);
    expect(login.headers['set-cookie'][0]).not.toMatch(/Domain=/);
  });
  it('rejects incorrect usernames and passwords using the same generic response', async () => {
    const server = app();
    const responses = await Promise.all([
      request(server)
        .post('/api/admin/login')
        .set(headers)
        .send({ username: 'incorrect', password }),
      request(server)
        .post('/api/admin/login')
        .set(headers)
        .send({ username: config.username, password: 'incorrect' }),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.headers['set-cookie']).toBeUndefined();
    }
    expect(responses[0]!.body).toEqual(responses[1]!.body);
  });
  it('validates login inputs strictly and limits login attempts', async () => {
    const server = createApp({ admin: { configuration: config, loginLimit: 2 } });
    expect((await request(server).post('/api/admin/login').set(headers).send({})).status).toBe(400);
    expect(
      (
        await request(server)
          .post('/api/admin/login')
          .set(headers)
          .send({ username: config.username, password, role: 'admin' })
      ).status,
    ).toBe(400);
    const limited = await request(server)
      .post('/api/admin/login')
      .set(headers)
      .send({ username: config.username, password });
    expect(limited.status).toBe(429);
    expect(limited.headers['cache-control']).toBe('no-store');
  });
  it('rejects missing, tampered, expired and rotated sessions', async () => {
    const now = Date.now();
    const server = createApp({ admin: { configuration: config, now: () => now } });
    for (const cookie of [
      '',
      'rozgar-admin=garbage',
      authenticatedHeaders(now - 9 * 60 * 60 * 1000).Cookie,
      `${authenticatedHeaders(now).Cookie}a`,
    ]) {
      const response = await request(server).get('/api/admin/session').set('Cookie', cookie);
      expect(response.status).toBe(401);
      expect(response.headers['cache-control']).toBe('no-store');
    }
    const rotated = createApp({
      admin: { configuration: { ...config, sessionSecret: randomBytes(32).toString('hex') } },
    });
    expect(
      (
        await request(rotated)
          .get('/api/admin/session')
          .set('Cookie', authenticatedHeaders().Cookie)
      ).status,
    ).toBe(401);
  });
  it('fails closed if admin credentials are not configured', async () => {
    const response = await request(createApp({ admin: { configuration: null } }))
      .post('/api/admin/login')
      .set(headers)
      .send({ username: 'test', password });
    expect(response.status).toBe(503);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('rejects missing or hostile Origins, simple requests and missing/wrong CSRF tokens', async () => {
    const server = app();
    const session = authenticatedHeaders();
    for (const badHeaders of [
      { ...session, Origin: 'https://evil.example' },
      { ...session, Origin: '' },
      { ...session, 'X-Admin-Request': '' },
      { ...session, 'X-CSRF-Token': '' },
      { ...session, 'X-CSRF-Token': 'forged' },
    ]) {
      const response = await request(server)
        .post('/api/admin/cv/issue')
        .set(badHeaders)
        .attach('cv', pdf, 'completed.pdf');
      expect(response.status).toBe(403);
      expect(response.headers['cache-control']).toBe('no-store');
    }
    const login = await request(server)
      .post('/api/admin/login')
      .send({ username: config.username, password });
    expect(login.status).toBe(403);
  });
  it('authenticates before parsing or processing a PDF', async () => {
    const response = await request(app())
      .post('/api/admin/cv/issue')
      .set(headers)
      .attach('cv', pdf, 'completed.pdf');
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/json/);
  });
  it('issues a visible, verifiable PDF and supports public verification and returning submission', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const server = createApp({
      admin: { configuration: config },
      applicationSubmissionEnabled: true,
      applications: { deliver, audit: vi.fn() },
    });
    const issued = await request(server)
      .post('/api/admin/cv/issue')
      .set(authenticatedHeaders())
      .attach('cv', pdf, 'completed.pdf');
    expect(issued.status).toBe(200);
    const reference = issued.headers['x-cv-reference'];
    expect(reference).toMatch(/^RL-CV-/);
    expect(issued.headers['content-disposition']).toBe(`attachment; filename="${reference}.pdf"`);
    expect(issued.headers['cache-control']).toBe('no-store');
    expect(verifyIssuedCv(issued.body, config.cvSigningSecret)).toEqual({ cvReference: reference });
    const document = await PDFDocument.load(issued.body);
    expect(document.getPageCount()).toBe(1);
    const streams = document.context
      .enumerateIndirectObjects()
      .filter((entry) => entry[1] instanceof PDFRawStream)
      .map((entry) => {
        try {
          return Buffer.from(decodePDFRawStream(entry[1] as PDFRawStream).decode()).toString(
            'ascii',
          );
        } catch {
          return '';
        }
      })
      .join('\n');
    expect(streams).toContain(Buffer.from(reference).toString('hex').toUpperCase());
    const verified = await request(server)
      .post('/api/cv/verify')
      .attach('cv', issued.body, 'official.pdf');
    expect(verified.body).toEqual({ valid: true, cvReference: reference });
    const submission = await request(server)
      .post('/api/applications')
      .field(
        'fields',
        JSON.stringify({
          firstName: 'Test',
          lastName: 'Applicant',
          email: 'test@example.invalid',
          phone: '03001234567',
          field: 'construction',
          countries: ['qatar'],
          selectedJobIds: ['occupation-001'],
          cvPathType: 'existing_rozgar_cv',
        }),
      )
      .attach('cv', issued.body, 'official.pdf');
    expect(submission.status).toBe(201);
    expect(deliver).toHaveBeenCalledTimes(1);
    const modified = Buffer.from(issued.body);
    modified[30] ^= 1;
    expect(verifyIssuedCv(modified, config.cvSigningSecret)).toBeUndefined();
    expect(verifyIssuedCv(issued.body, randomBytes(32).toString('hex'))).toBeUndefined();
  });
  it('rejects invalid, malformed, oversized, unexpected or already-signed uploads', async () => {
    const server = app();
    for (const pending of [
      request(server).post('/api/admin/cv/issue').set(authenticatedHeaders()),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .attach('cv', Buffer.from('not a PDF'), 'completed.pdf'),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .attach('cv', Buffer.from('%PDF-1.7\ninvalid\n%%EOF'), 'completed.pdf'),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .attach('other', pdf, 'completed.pdf'),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .field('name', 'Unexpected')
        .attach('cv', pdf, 'completed.pdf'),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .attach('cv', pdf, 'completed.doc'),
      request(server)
        .post('/api/admin/cv/issue')
        .set(authenticatedHeaders())
        .attach('cv', pdf, 'one.pdf')
        .attach('cv', pdf, 'two.pdf'),
    ])
      expect((await pending).status).toBe(400);
    const tooLarge = await request(server)
      .post('/api/admin/cv/issue')
      .set(authenticatedHeaders())
      .attach('cv', Buffer.alloc(5 * 1024 * 1024 + 1), 'big.pdf');
    expect(tooLarge.status).toBe(413);
    const issued = await request(server)
      .post('/api/admin/cv/issue')
      .set(authenticatedHeaders())
      .attach('cv', pdf, 'completed.pdf');
    expect(
      (
        await request(server)
          .post('/api/admin/cv/issue')
          .set(authenticatedHeaders())
          .attach('cv', issued.body, 'issued.pdf')
      ).status,
    ).toBe(400);
  });
  it('keeps sessions valid across app instances and applies the Vercel size cap', async () => {
    vi.stubEnv('VERCEL', '1');
    const response = await request(app())
      .get('/api/admin/session')
      .set('Cookie', authenticatedHeaders().Cookie);
    expect(response.status).toBe(200);
    expect(response.body.maxUploadBytes).toBe(4 * 1024 * 1024);
    const other = await request(app())
      .get('/api/admin/session')
      .set('Cookie', authenticatedHeaders().Cookie);
    expect(other.status).toBe(200);
  });
});
