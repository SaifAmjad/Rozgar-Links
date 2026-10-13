import { z } from 'zod';

import { supportedCurrencySchema } from './application.js';

export const publicConfigResponseSchema = z
  .object({
    bankAccountTitle: z.string().trim().min(1).max(120),
    bankName: z.string().trim().min(1).max(120),
    bankAccountNumber: z.string().trim().min(1).max(80),
    bankIban: z.string().trim().min(1).max(80),
    serviceFeeAmount: z.number().finite().nonnegative(),
    serviceFeeCurrency: supportedCurrencySchema,
    taxonomyVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    isDemoPayment: z.literal(true),
  })
  .strict();

export type PublicConfigResponse = z.infer<typeof publicConfigResponseSchema>;
