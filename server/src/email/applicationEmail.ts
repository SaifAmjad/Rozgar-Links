import { jobTaxonomy, type ApplicationFields } from '@rozgar-links/shared';

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
  return value
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maximum);
}

function displayValue(value: unknown) {
  return value === undefined || value === '' ? 'Not provided' : String(value);
}

const countryLabels: Record<string, string> = {
  'saudi-arabia': 'Saudi Arabia',
  'united-arab-emirates': 'United Arab Emirates',
  oman: 'Oman',
  qatar: 'Qatar',
  kuwait: 'Kuwait',
  bahrain: 'Bahrain',
};

const fieldLabels = new Map(jobTaxonomy.fields.map((field) => [field.id, field.label]));

type SummaryRow = readonly [label: string, value: string];

function applicationSections(application: ApplicationFields) {
  const countries = application.countries
    .map((country) => countryLabels[country] ?? country)
    .join(', ');
  const gender = application.gender
    ? `${application.gender.charAt(0).toUpperCase()}${application.gender.slice(1)}`
    : 'Not provided';

  return [
    {
      title: 'Applicant details',
      rows: [
        ['Full name', `${application.firstName} ${application.lastName}`.trim()],
        ['Date of birth', application.dateOfBirth],
        ['Gender', gender],
        ['CNIC', application.nationalId],
        ['Email address', application.email],
        ['Phone / WhatsApp', application.phone],
        ['Current city', application.currentCity],
      ] satisfies SummaryRow[],
    },
    {
      title: 'Job preferences',
      rows: [
        ['Preferred countries', countries],
        ['Job field', fieldLabels.get(application.field) ?? application.field],
        [
          'Experience',
          `${displayValue(application.yearsExperience)} year${application.yearsExperience === 1 ? '' : 's'}`,
        ],
      ] satisfies SummaryRow[],
    },
  ];
}

function attachmentRows(files?: ValidatedApplicationFiles): SummaryRow[] {
  return [
    ['CV', files?.cv.filename ?? 'Attached to this email'],
    ['Payment screenshot', files?.paymentScreenshot.filename ?? 'Attached to this email'],
  ];
}

function renderRows(rows: SummaryRow[]) {
  return rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:700;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;line-height:1.5;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('');
}

function renderSection(title: string, rows: SummaryRow[]) {
  return `<tr><td style="padding:0 28px 24px;">
    <h2 style="margin:0 0 10px;color:#0b3c73;font-family:Arial,sans-serif;font-size:17px;line-height:1.4;">${escapeHtml(title)}</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;">
      ${renderRows(rows)}
    </table>
  </td></tr>`;
}

export function renderApplicationHtml(
  application: ApplicationFields,
  referenceId: string,
  files?: ValidatedApplicationFiles,
) {
  const sections = applicationSections(application)
    .map((section) => renderSection(section.title, section.rows))
    .join('');
  const attachments = renderSection('Attachments', attachmentRows(files));

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <tr><td style="background:#0b3c73;padding:28px;">
            <p style="margin:0 0 8px;color:#b9f4cf;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Rozgar Links</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;">New job application</h1>
            <p style="margin:12px 0 0;color:#dbeafe;font-size:14px;">Reference: <strong style="color:#ffffff;">${escapeHtml(referenceId)}</strong></p>
          </td></tr>
          <tr><td style="padding:24px 28px 20px;">
            <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">A new application was submitted through Rozgar Links. Review the applicant details and both attachments below.</p>
            <div style="margin-top:16px;padding:12px 14px;background:#fff7ed;border-left:4px solid #d97706;border-radius:8px;color:#7c2d12;font-size:13px;line-height:1.5;"><strong>Manual review required:</strong> payment evidence has not been verified.</div>
          </td></tr>
          ${sections}
          ${attachments}
          <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">Confidential applicant information. Handle and delete it according to your approved privacy and retention policy.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderApplicationText(
  application: ApplicationFields,
  referenceId: string,
  files?: ValidatedApplicationFiles,
) {
  const sections = applicationSections(application)
    .map(
      (section) =>
        `${section.title}\n${section.rows.map(([label, value]) => `${label}: ${value}`).join('\n')}`,
    )
    .join('\n\n');
  const attachments = attachmentRows(files)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

  return `ROZGAR LINKS - NEW JOB APPLICATION\nReference: ${referenceId}\n\nPayment evidence requires manual review.\n\n${sections}\n\nAttachments\n${attachments}\n\nConfidential applicant information. Handle it according to your approved privacy and retention policy.`;
}

function wasAccepted(result: ApplicationMailResult) {
  return Array.isArray(result.accepted) && result.accepted.length > 0;
}

export interface ApplicationDeliveryInput {
  application: ApplicationFields;
  files: ValidatedApplicationFiles;
  referenceId: string;
}

export async function deliverApplication(
  { application, files, referenceId }: ApplicationDeliveryInput,
  mailTransport: ApplicationMailTransport = getMailTransport(),
) {
  const fullName = safeHeaderValue(`${application.firstName} ${application.lastName}`);
  const attachments = Object.values(files).map((file) => ({
    content: file.buffer,
    contentType: file.mimeType,
    filename: file.filename,
  }));
  const adminResult = await mailTransport.sendMail({
    attachments,
    from: env.MAIL_FROM,
    html: renderApplicationHtml(application, referenceId, files),
    subject: `New application - ${fullName} - ${referenceId}`,
    text: renderApplicationText(application, referenceId, files),
    to: env.ADMIN_EMAIL,
  });

  if (!wasAccepted(adminResult)) throw new AdminDeliveryError();
}
