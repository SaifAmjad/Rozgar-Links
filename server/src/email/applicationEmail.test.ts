import { describe, expect, it, vi } from 'vitest';

import { applicationFieldsSchema } from '@rozgar-links/shared';

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
  nationality: 'Pakistan',
  nationalId: '12345-1234567-1',
  passportNumber: 'TEST-PASSPORT',
  passportExpiry: '2030-12-31',
  email: 'applicant@example.com',
  phone: '+923001234567',
  currentCity: 'Lahore',
  currentCountry: 'Pakistan',
  countries: ['saudi-arabia'],
  field: 'construction',
  roles: ['mason'],
  yearsExperience: 4,
  highestEducation: 'Diploma',
  languages: [],
  hasDrivingLicence: false,
  willingToRelocate: true,
  skills: [],
  transactionReference: 'DEMO-TRANSACTION',
  paymentDate: '2026-10-01',
  acceptTerms: true,
  confirmAccuracy: true,
  acceptFeePolicy: true,
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
      notes: '<img src=x onerror=alert(1)>',
    };

    const result = await deliverApplication(
      { application: unsafeApplication, files, referenceId: 'RL-2026-ABC234' },
      transport,
      { sendApplicantConfirmation: false },
    );

    expect(result.confirmationEmailSent).toBe(false);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    const message = transport.sendMail.mock.calls[0]?.[0];
    expect(message?.subject).not.toMatch(/[\r\n]/);
    expect(message?.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(message?.html).not.toContain('<img src=x');
    expect(message?.attachments).toHaveLength(2);
  });

  it('fails when the admin recipient is not accepted', async () => {
    const transport = transportWith({ accepted: [] });

    await expect(
      deliverApplication(
        { application, files, referenceId: 'RL-2026-ABC234' },
        transport,
        { sendApplicantConfirmation: false },
      ),
    ).rejects.toBeInstanceOf(AdminDeliveryError);
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });

  it('reports the applicant confirmation result without undoing accepted admin delivery', async () => {
    const failedConfirmation = transportWith(
      { accepted: ['admin@example.com'] },
      { accepted: [] },
    );
    const acceptedConfirmation = transportWith(
      { accepted: ['admin@example.com'] },
      { accepted: ['applicant@example.com'] },
    );

    await expect(
      deliverApplication(
        { application, files, referenceId: 'RL-2026-ABC234' },
        failedConfirmation,
        { sendApplicantConfirmation: true },
      ),
    ).resolves.toEqual({ confirmationEmailSent: false });
    await expect(
      deliverApplication(
        { application, files, referenceId: 'RL-2026-ABC235' },
        acceptedConfirmation,
        { sendApplicantConfirmation: true },
      ),
    ).resolves.toEqual({ confirmationEmailSent: true });
  });

  it('renders a complete escaped summary without unsafe markup', () => {
    const html = renderApplicationHtml({ ...application, notes: '<script>alert(1)</script>' }, 'RL-2026-ABC234');

    expect(html).toContain('Personal');
    expect(html).toContain('Preferences');
    expect(html).toContain('Payment');
    expect(html).not.toContain('<script>');
  });
});
