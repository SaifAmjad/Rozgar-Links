import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { validate as validateCron } from 'node-cron';
import { z } from 'zod';
import { adminPasswordHashSchema } from '../admin/password.js';

const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url));
const serverEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const selectedEnvPath = existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath;

dotenv.config({ path: selectedEnvPath, quiet: true });

const singleEmailAddressSchema = z
  .string()
  .trim()
  .email()
  .refine((value) => !/[,;\r\n]/.test(value), 'Enter exactly one email address.');

export const envSchema = z
  .object({
    ADMIN_USERNAME: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().trim().min(1).max(100).optional(),
    ),
    ADMIN_PASSWORD_HASH: z.preprocess(
      (value) => (value === '' ? undefined : value),
      adminPasswordHashSchema.optional(),
    ),
    ADMIN_SESSION_SECRET: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .string()
        .regex(/^[a-fA-F0-9]{64}$/)
        .optional(),
    ),
    CV_SIGNING_SECRET: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .string()
        .regex(/^[a-fA-F0-9]{64}$/, 'Use a random 32-byte hex key.')
        .optional(),
    ),
    ADMIN_EMAIL: singleEmailAddressSchema.default('admin@example.invalid'),
    APP_TIME_ZONE: z
      .string()
      .trim()
      .refine((timeZone) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone }).format();
          return true;
        } catch {
          return false;
        }
      }, 'Invalid IANA timezone.')
      .default('Asia/Karachi'),
    APPLICATION_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(5),
    APPLICATION_SUBMISSION_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    BANK_ACCOUNT_NUMBER: z.string().trim().min(1).default('DEMO-NOT-FOR-PAYMENT'),
    BANK_ACCOUNT_TITLE: z.string().trim().min(1).default('Demo Account — Do Not Pay'),
    BANK_IBAN: z.string().trim().min(1).default('DEMO-NOT-FOR-PAYMENT'),
    BANK_NAME: z.string().trim().min(1).default('Sample Bank (Demo)'),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    ENABLE_SCRAPING: z
      .literal('false')
      .default('false')
      .transform(() => false as const),
    MAIL_FROM: z.string().trim().min(3).max(254).default('Rozgar Links <no-reply@example.invalid>'),
    MAX_FILE_MB: z.coerce.number().int().min(1).max(10).default(5),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PAYMENT_DETAILS_ARE_DEMO: z
      .literal('true')
      .default('true')
      .transform(() => true as const),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    SERVICE_FEE_AMOUNT: z.coerce.number().finite().nonnegative().default(250),
    SERVICE_FEE_CURRENCY: z.literal('PKR').default('PKR'),
    SMTP_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(10_000),
    SMTP_HOST: z.string().trim().min(1).default('smtp.example.invalid'),
    SMTP_PASS: z.string().min(1).default('replace-me'),
    SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().trim().min(1).default('replace-me'),
    STATS_CRON: z
      .string()
      .trim()
      .refine(validateCron, 'Invalid cron expression.')
      .default('5 0 * * *'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
  })
  .superRefine((config, context) => {
    const adminKeys = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'ADMIN_SESSION_SECRET'] as const;
    if (!adminKeys.some((key) => config[key] !== undefined)) return;
    for (const key of [...adminKeys, 'CV_SIGNING_SECRET'] as const) {
      if (!config[key])
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Complete the admin configuration.',
        });
    }
    if (
      config.ADMIN_SESSION_SECRET &&
      config.ADMIN_SESSION_SECRET.toLowerCase() === config.CV_SIGNING_SECRET?.toLowerCase()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADMIN_SESSION_SECRET'],
        message: 'Use a separate session key.',
      });
    }
    if (config.NODE_ENV === 'production' && !config.CLIENT_URL.startsWith('https://')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CLIENT_URL'],
        message: 'Admin production deployment requires HTTPS.',
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidKeys = Object.keys(parsedEnv.error.flatten().fieldErrors).join(', ');
  throw new Error(`Invalid server environment configuration: ${invalidKeys}`);
}

export const env = parsedEnv.data;
