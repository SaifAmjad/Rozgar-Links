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
  BANK_ACCOUNT_NUMBER: z.string().trim().min(1).default('DEMO-NOT-FOR-PAYMENT'),
  BANK_ACCOUNT_TITLE: z.string().trim().min(1).default('Demo Account — Do Not Pay'),
  BANK_IBAN: z.string().trim().min(1).default('DEMO-NOT-FOR-PAYMENT'),
  BANK_NAME: z.string().trim().min(1).default('Sample Bank (Demo)'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PAYMENT_DETAILS_ARE_DEMO: z
    .literal('true')
    .default('true')
    .transform(() => true as const),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  SERVICE_FEE_AMOUNT: z.coerce.number().finite().nonnegative().default(5000),
  SERVICE_FEE_CURRENCY: supportedCurrencySchema.default('PKR'),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidKeys = Object.keys(parsedEnv.error.flatten().fieldErrors).join(', ');
  throw new Error(`Invalid server environment configuration: ${invalidKeys}`);
}

export const env = parsedEnv.data;
