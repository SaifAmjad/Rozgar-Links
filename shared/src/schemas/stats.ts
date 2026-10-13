import { z } from 'zod';

export const gccCountryNames = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Oman',
  'Qatar',
  'Kuwait',
  'Bahrain',
] as const;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const countSchema = z.number().int().nonnegative();

export const statsProvenanceSchema = z.enum(['estimated', 'authorized']);

export const statsCountryEntrySchema = z
  .object({
    country: z.enum(gccCountryNames),
    count: countSchema,
  })
  .strict();

export const statsFieldEntrySchema = z
  .object({
    field: z.string().trim().min(1).max(80),
    count: countSchema,
  })
  .strict();

export const statsTrendEntrySchema = z
  .object({
    date: isoDateSchema,
    totalOpenings: countSchema,
  })
  .strict();

export const statsResponseSchema = z
  .object({
    date: isoDateSchema,
    totalOpenings: countSchema,
    byCountry: z.array(statsCountryEntrySchema).length(gccCountryNames.length),
    byField: z.array(statsFieldEntrySchema).length(12),
    newToday: countSchema,
    last7Days: z.array(statsTrendEntrySchema).length(7),
    lastUpdated: z.string().datetime({ offset: true }),
    provenance: statsProvenanceSchema,
    isStale: z.boolean(),
  })
  .strict()
  .superRefine((stats, context) => {
    const countryTotal = stats.byCountry.reduce((sum, entry) => sum + entry.count, 0);
    const fieldTotal = stats.byField.reduce((sum, entry) => sum + entry.count, 0);
    const countryNames = new Set(stats.byCountry.map((entry) => entry.country));
    const fieldNames = new Set(stats.byField.map((entry) => entry.field));
    const latestTrend = stats.last7Days.at(-1);
    const chronologicalDates = stats.last7Days.map((entry) => entry.date);

    if (countryTotal !== stats.totalOpenings) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Country totals must equal total openings.',
        path: ['byCountry'],
      });
    }

    if (fieldTotal !== stats.totalOpenings) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Field totals must equal total openings.',
        path: ['byField'],
      });
    }

    if (countryNames.size !== stats.byCountry.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Country entries must be unique.',
        path: ['byCountry'],
      });
    }

    if (fieldNames.size !== stats.byField.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Field entries must be unique.',
        path: ['byField'],
      });
    }

    if (stats.newToday > stats.totalOpenings) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New openings cannot exceed total openings.',
        path: ['newToday'],
      });
    }

    if (latestTrend?.date !== stats.date || latestTrend.totalOpenings !== stats.totalOpenings) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The latest trend entry must match the current snapshot.',
        path: ['last7Days'],
      });
    }

    if (
      chronologicalDates.some((date, index) => index > 0 && date <= chronologicalDates[index - 1]!)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Trend entries must be chronological.',
        path: ['last7Days'],
      });
    }
  });

export const statsHistoryResponseSchema = z
  .object({
    days: z.number().int().min(1).max(30),
    entries: z.array(statsTrendEntrySchema).min(1).max(30),
    lastUpdated: z.string().datetime({ offset: true }),
    provenance: statsProvenanceSchema,
    isStale: z.boolean(),
  })
  .strict()
  .superRefine((history, context) => {
    if (history.entries.length !== history.days) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'History entry count must match requested days.',
        path: ['entries'],
      });
    }

    if (
      history.entries.some(
        (entry, index) => index > 0 && entry.date <= history.entries[index - 1]!.date,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'History entries must be chronological.',
        path: ['entries'],
      });
    }
  });

export type StatsResponse = z.infer<typeof statsResponseSchema>;
export type StatsHistoryResponse = z.infer<typeof statsHistoryResponseSchema>;
export type StatsTrendEntry = z.infer<typeof statsTrendEntrySchema>;
