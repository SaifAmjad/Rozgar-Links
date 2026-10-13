import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

export interface ApplicationMailOptions {
  attachments?: { content: Buffer; contentType: string; filename: string }[];
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}

export interface ApplicationMailResult {
  accepted?: unknown;
}

export interface ApplicationMailTransport {
  sendMail(options: ApplicationMailOptions): Promise<ApplicationMailResult>;
}

export class SmtpUnavailableError extends Error {
  constructor() {
    super('SMTP is not configured.');
    this.name = 'SmtpUnavailableError';
  }
}

let transport: ApplicationMailTransport | undefined;

function smtpIsConfigured() {
  return (
    env.SMTP_HOST !== 'smtp.example.invalid' &&
    env.SMTP_USER !== 'replace-me' &&
    env.SMTP_PASS !== 'replace-me' &&
    !env.ADMIN_EMAIL.endsWith('.invalid')
  );
}

export function getMailTransport(): ApplicationMailTransport {
  if (!smtpIsConfigured()) throw new SmtpUnavailableError();
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    requireTLS: !env.SMTP_SECURE,
    connectionTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
    socketTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { minVersion: 'TLSv1.2' },
  });
  return transport;
}
