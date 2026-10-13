import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { validate as validateCron } from 'node-cron';
import { z } from 'zod';

import { supportedCurrencySchema } from '@rozgar-links/shared';

const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url));
const serverEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const selectedEnvPath = existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath;

dotenv.config({ path: selectedEnvPath, quiet: true });

const envSchema = z.object({
  ADMIN_EMAIL: z.string().trim().email().default('admin@example.invalid'),
  APPLICATION_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(5),
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
  SEND_APPLICANT_CONFIRMATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SERVICE_FEE_AMOUNT: z.coerce.number().finite().nonnegative().default(5000),
  SERVICE_FEE_CURRENCY: supportedCurrencySchema.default('PKR'),
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
  TZ: z
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
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidKeys = Object.keys(parsedEnv.error.flatten().fieldErrors).join(', ');
  throw new Error(`Invalid server environment configuration: ${invalidKeys}`);
}

export const env = parsedEnv.data;
