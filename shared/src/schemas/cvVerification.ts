import { z } from 'zod';

export const cvReferenceSchema = z.string().regex(/^RL-CV-\d{4}-[A-Z2-9]{12}$/);
export const cvVerificationResponseSchema = z.discriminatedUnion('valid', [
  z.object({ valid: z.literal(true), cvReference: cvReferenceSchema }).strict(),
  z.object({ valid: z.literal(false), message: z.string().min(1).max(240) }).strict(),
]);
export type CvVerificationResponse = z.infer<typeof cvVerificationResponseSchema>;
