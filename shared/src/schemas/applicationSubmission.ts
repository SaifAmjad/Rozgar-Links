import { z } from 'zod';

export const applicationSubmissionResponseSchema = z
  .object({
    success: z.literal(true),
    referenceId: z.string().regex(/^RL-\d{4}-[A-Z2-9]{6}$/),
  })
  .strict();

export type ApplicationSubmissionResponse = z.infer<typeof applicationSubmissionResponseSchema>;
