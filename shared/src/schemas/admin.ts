import { z } from 'zod';

export const adminLoginSchema = z
  .object({
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(256),
  })
  .strict();

export const adminSessionSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(false) }).strict(),
  z
    .object({
      authenticated: z.literal(true),
      csrfToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
      expiresAt: z.string().datetime(),
      maxUploadBytes: z.number().int().positive(),
    })
    .strict(),
]);

export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type AuthenticatedAdminSession = Extract<AdminSession, { authenticated: true }>;
