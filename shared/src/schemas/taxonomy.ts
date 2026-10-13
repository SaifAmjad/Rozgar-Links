import { z } from 'zod';

const kebabCaseIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'IDs must use lowercase kebab-case.');

export const jobRoleSchema = z
  .object({
    id: kebabCaseIdSchema,
    label: z.string().trim().min(1).max(80),
  })
  .strict();

export const jobFieldSchema = z
  .object({
    id: kebabCaseIdSchema,
    label: z.string().trim().min(1).max(80),
    roles: z.array(jobRoleSchema).min(9).max(16),
  })
  .strict()
  .superRefine((field, context) => {
    const roleIds = field.roles.map((role) => role.id);
    if (new Set(roleIds).size !== roleIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Role IDs must be unique within ${field.id}.`,
        path: ['roles'],
      });
    }

    const genuineRoleCount = field.roles.filter((role) => role.id !== 'other').length;
    if (genuineRoleCount < 8 || genuineRoleCount > 15) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field.id} must contain 8–15 genuine roles.`,
        path: ['roles'],
      });
    }

    const otherRoles = field.roles.filter((role) => role.id === 'other');
    if (otherRoles.length !== 1 || otherRoles[0]?.label !== 'Other') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field.id} must contain one consistently labelled Other role.`,
        path: ['roles'],
      });
    }
  });

export const jobTaxonomySchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must use semantic versioning.'),
    fields: z.array(jobFieldSchema).length(12),
  })
  .strict()
  .superRefine((taxonomy, context) => {
    const fieldIds = taxonomy.fields.map((field) => field.id);
    if (new Set(fieldIds).size !== fieldIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Field IDs must be unique.',
        path: ['fields'],
      });
    }
  });

export type JobRole = z.infer<typeof jobRoleSchema>;
export type JobField = z.infer<typeof jobFieldSchema>;
export type JobTaxonomy = z.infer<typeof jobTaxonomySchema>;
