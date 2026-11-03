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
  email: 'applicant@example.com',
  phone: '03001234567',
  countries: ['saudi-arabia'],
  field: 'construction',
  selectedJobIds: ['occupation-001'],
  cvPathType: 'new_cv_required',
});

const files: ValidatedApplicationFiles = {
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
  it('renders the new education occupation labels for administrators', () => {
    const html = renderApplicationHtml(
      { ...application, field: 'education', selectedJobIds: ['occupation-065', 'occupation-070'] },
      'RL-2026-ABC234',
      files,
    );
    expect(html).toContain('Primary School Teacher');
    expect(html).toContain('Teaching Assistant');
  });
  it('escapes HTML values and removes line breaks from the subject', async () => {
    const transport = transportWith({ accepted: ['admin@example.com'] });
    const unsafeApplication = {
      ...application,
      firstName: 'Test\r\nBcc: attacker@example.com',
      lastName: '<img src=x onerror=alert(1)>',
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
    expect(message?.attachments).toHaveLength(1);
    expect(message?.to).toBe(env.ADMIN_EMAIL);
    expect(message).not.toHaveProperty('cc');
    expect(message).not.toHaveProperty('bcc');
    expect(message?.subject).toContain('New CV Preparation + Job Application');
    expect(message?.html).toContain('Pending manual review');
    expect(message?.html).toContain('payment.png');
  });

  it('fails when the admin recipient is not accepted', async () => {
    const transport = transportWith({ accepted: [] });

    await expect(
      deliverApplication({ application, files, referenceId: 'RL-2026-ABC234' }, transport),
    ).rejects.toBeInstanceOf(AdminDeliveryError);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });
  it('maps a rejected SMTP connection to a safe delivery failure', async () => {
    const transport = {
      sendMail: vi.fn().mockRejectedValue(new Error('private SMTP diagnostics')),
    };
    await expect(
      deliverApplication({ application, files, referenceId: 'RL-2026-ABC234' }, transport),
    ).rejects.toBeInstanceOf(AdminDeliveryError);
  });

  it('renders a complete escaped summary without unsafe markup', () => {
    const html = renderApplicationHtml(
      { ...application, lastName: '<script>alert(1)</script>' },
      'RL-2026-ABC234',
    );

    expect(html).toContain('Applicant details');
    expect(html).toContain('Job preferences');
    expect(html).toContain('Attachments');
    expect(html).toContain('Rozgar Links');
    expect(html).not.toContain('<script>');
  });
  it('sends only the official CV with a waived fee for returning applicants', async () => {
    const transport = transportWith({ accepted: ['admin@example.com'] });
    await deliverApplication(
      {
        application: { ...application, cvPathType: 'existing_rozgar_cv' },
        referenceId: 'RL-2026-ABC234',
        cvReference: 'RL-CV-2026-ABCDEFGH2345',
        files: {
          ...files,
          cv: {
            buffer: Buffer.from('pdf'),
            filename: 'official.pdf',
            fieldName: 'cv',
            mimeType: 'application/pdf',
            size: 3,
          },
        },
      },
      transport,
    );
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    const message = transport.sendMail.mock.calls[0]?.[0];
    expect(message?.subject).toContain('Returning Applicant');
    expect(message?.attachments).toHaveLength(1);
    expect(message?.attachments?.[0]?.filename).toBe('official.pdf');
    expect(message?.html).toContain('Waived (PKR 0)');
    expect(message?.html).toContain('RL-CV-2026-ABCDEFGH2345');
    expect(message?.html).not.toContain('payment.png');
    expect(message?.text).toContain('No new CV preparation fee is required.');
  });
});
