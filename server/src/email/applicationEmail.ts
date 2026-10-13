import type { ApplicationFields } from '@rozgar-links/shared';

import { env } from '../config/env.js';
import type { ValidatedApplicationFiles } from '../middleware/upload.js';
import {
  getMailTransport,
  type ApplicationMailResult,
  type ApplicationMailTransport,
} from './transport.js';

export class AdminDeliveryError extends Error {
  constructor() {
    super('The administrator email was not accepted by SMTP.');
    this.name = 'AdminDeliveryError';
  }
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeHeaderValue(value: string, maximum = 100) {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, maximum);
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === 'object' && 'language' in item && 'level' in item
          ? `${String(item.language)} (${String(item.level)})`
          : String(item),
      )
      .join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value === undefined || value === '' ? 'Not provided' : String(value);
}

const sectionFields = {
  Personal: [
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'nationality',
    'nationalId',
    'passportNumber',
    'passportExpiry',
    'email',
    'phone',
    'currentCity',
    'currentCountry',
    'maritalStatus',
  ],
  Preferences: [
    'countries',
    'field',
    'roles',
    'otherRole',
    'yearsExperience',
    'highestEducation',
    'lastJobTitle',
    'expectedSalaryMin',
    'expectedSalaryMax',
    'salaryCurrency',
    'preferredJoiningDate',
    'languages',
    'hasDrivingLicence',
    'licenceCountry',
    'willingToRelocate',
    'skills',
    'notes',
  ],
  Payment: [
    'transactionReference',
    'paymentDate',
    'acceptTerms',
    'confirmAccuracy',
    'acceptFeePolicy',
  ],
} as const satisfies Record<string, readonly (keyof ApplicationFields)[]>;

function labelFor(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

export function renderApplicationHtml(application: ApplicationFields, referenceId: string) {
  const sections = Object.entries(sectionFields)
    .map(([title, fields]) => {
      const rows = fields
        .map(
          (field) =>
            `<tr><th align="left" style="padding:6px;border:1px solid #e2e8f0">${escapeHtml(labelFor(field))}</th><td style="padding:6px;border:1px solid #e2e8f0">${escapeHtml(displayValue(application[field]))}</td></tr>`,
        )
        .join('');
      return `<h2>${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%">${rows}</table>`;
    })
    .join('');

  return `<main><h1>New Rozgar Links application</h1><p>Reference: <strong>${escapeHtml(referenceId)}</strong></p><p>Payment evidence is unverified and requires manual review.</p>${sections}</main>`;
}

export function renderApplicationText(application: ApplicationFields, referenceId: string) {
  const sections = Object.entries(sectionFields)
    .map(
      ([title, fields]) =>
        `${title}\n${fields.map((field) => `${labelFor(field)}: ${displayValue(application[field])}`).join('\n')}`,
    )
    .join('\n\n');
  return `New Rozgar Links application\nReference: ${referenceId}\nPayment evidence is unverified and requires manual review.\n\n${sections}`;
}

function wasAccepted(result: ApplicationMailResult) {
  return Array.isArray(result.accepted) && result.accepted.length > 0;
}

export interface ApplicationDeliveryInput {
  application: ApplicationFields;
  files: ValidatedApplicationFiles;
  referenceId: string;
}

export interface ApplicationDeliveryResult {
  confirmationEmailSent: boolean;
}

export interface ApplicationDeliveryOptions {
  sendApplicantConfirmation?: boolean;
}

export async function deliverApplication(
  { application, files, referenceId }: ApplicationDeliveryInput,
  mailTransport: ApplicationMailTransport = getMailTransport(),
  options: ApplicationDeliveryOptions = {},
): Promise<ApplicationDeliveryResult> {
  const fullName = safeHeaderValue(`${application.firstName} ${application.lastName}`);
  const attachments = Object.values(files).map((file) => ({
    content: file.buffer,
    contentType: file.mimeType,
    filename: file.filename,
  }));
  const adminResult = await mailTransport.sendMail({
    attachments,
    from: env.MAIL_FROM,
    html: renderApplicationHtml(application, referenceId),
    subject: `New Application – ${fullName} – ${referenceId}`,
    text: renderApplicationText(application, referenceId),
    to: env.ADMIN_EMAIL,
  });
  if (!wasAccepted(adminResult)) throw new AdminDeliveryError();

  const sendApplicantConfirmation =
    options.sendApplicantConfirmation ?? env.SEND_APPLICANT_CONFIRMATION;
  if (!sendApplicantConfirmation) return { confirmationEmailSent: false };

  try {
    const confirmationResult = await mailTransport.sendMail({
      from: env.MAIL_FROM,
      html: `<main><h1>Application received by Rozgar Links</h1><p>Reference: <strong>${escapeHtml(referenceId)}</strong></p><p>This confirms SMTP acceptance only. It is not payment verification or a placement guarantee.</p></main>`,
      subject: `Rozgar Links application reference ${referenceId}`,
      text: `Application received by Rozgar Links. Reference: ${referenceId}. This is not payment verification or a placement guarantee.`,
      to: application.email,
    });
    return { confirmationEmailSent: wasAccepted(confirmationResult) };
  } catch {
    return { confirmationEmailSent: false };
  }
}
