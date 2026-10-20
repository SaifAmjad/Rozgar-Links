import { describe, expect, it, vi } from 'vitest';

import { applicationFieldsSchema } from '@rozgar-links/shared';

import { env } from '../config/env.js';
import type { ValidatedApplicationFiles } from '../middleware/upload.js';
import {
  AdminDeliveryError,
  deliverApplication,
  renderApplicationHtml,
} from './applicationEmail.js';
import type { ApplicationMailTransport } from './transport.js';

const application = applicationFieldsSchema.parse({
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
});

const files: ValidatedApplicationFiles = {
  cv: {
    buffer: Buffer.from('pdf'),
    fieldName: 'cv',
    filename: 'resume.pdf',
    mimeType: 'application/pdf',
    size: 3,
  },
  paymentScreenshot: {
    buffer: Buffer.from('png'),
    fieldName: 'paymentScreenshot',
    filename: 'payment.png',
    mimeType: 'image/png',
    size: 3,
  },
};

function transportWith(...results: { accepted?: unknown }[]) {
  return {
    sendMail: vi.fn().mockImplementation(() => Promise.resolve(results.shift() ?? {})),
  } satisfies ApplicationMailTransport;
}

describe('application email delivery', () => {
  it('escapes HTML values and removes line breaks from the subject', async () => {
    const transport = transportWith({ accepted: ['admin@example.com'] });
    const unsafeApplication = {
      ...application,
      firstName: 'Test\r\nBcc: attacker@example.com',
      currentCity: '<img src=x onerror=alert(1)>',
    };

    await deliverApplication(
      { application: unsafeApplication, files, referenceId: 'RL-2026-ABC234' },
      transport,
    );

    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    const message = transport.sendMail.mock.calls[0]?.[0];
    expect(message?.subject).not.toMatch(/[\r\n]/);
    expect(message?.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(message?.html).not.toContain('<img src=x');
    expect(message?.attachments).toHaveLength(2);
    expect(message?.to).toBe(env.ADMIN_EMAIL);
    expect(message).not.toHaveProperty('cc');
    expect(message).not.toHaveProperty('bcc');
    expect(message?.html).toContain('resume.pdf');
    expect(message?.html).toContain('payment.png');
  });

  it('fails when the admin recipient is not accepted', async () => {
    const transport = transportWith({ accepted: [] });

    await expect(
      deliverApplication({ application, files, referenceId: 'RL-2026-ABC234' }, transport),
    ).rejects.toBeInstanceOf(AdminDeliveryError);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });

  it('renders a complete escaped summary without unsafe markup', () => {
    const html = renderApplicationHtml(
      { ...application, currentCity: '<script>alert(1)</script>' },
      'RL-2026-ABC234',
    );

    expect(html).toContain('Applicant details');
    expect(html).toContain('Job preferences');
    expect(html).toContain('Attachments');
    expect(html).toContain('Rozgar Links');
    expect(html).not.toContain('<script>');
  });
});
