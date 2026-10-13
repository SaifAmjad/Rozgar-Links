import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { z } from 'zod';

const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url));
const serverEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const selectedEnvPath = existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath;

dotenv.config({ path: selectedEnvPath, quiet: true });

const envSchema = z.object({
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidKeys = Object.keys(parsedEnv.error.flatten().fieldErrors).join(', ');
  throw new Error(`Invalid server environment configuration: ${invalidKeys}`);
}

export const env = parsedEnv.data;
