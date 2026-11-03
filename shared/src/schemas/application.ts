import { z } from 'zod';

import { jobFieldsById } from '../taxonomy.js';
import { occupationsForField } from '../occupations.js';

export const gulfCountries = [
  'saudi-arabia',
  'united-arab-emirates',
  'oman',
  'qatar',
  'kuwait',
  'bahrain',
] as const;

export const supportedCurrencies = [
  'PKR',
  'SAR',
  'AED',
  'OMR',
  'QAR',
  'KWD',
  'BHD',
  'USD',
] as const;
export const supportedCurrencySchema = z.enum(supportedCurrencies);

const requiredText = (label: string, maximum: number) =>
  z.string().trim().min(1, `${label} is required.`).max(maximum, `${label} is too long.`);

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maximum).optional(),
  );

export const cvPathTypeSchema = z.enum(['existing_rozgar_cv', 'new_cv_required'], {
  required_error: 'Choose your CV status.',
  invalid_type_error: 'Choose your CV status.',
});

const countriesSchema = z
  .array(z.enum([...gulfCountries, 'all-gulf']))
  .min(1, 'Select at least one Gulf country.')
  .transform((countries) =>
    countries.includes('all-gulf') ? [...gulfCountries] : [...new Set(countries)],
  );

export function createApplicationFieldsSchema() {
  return z
    .object({
      firstName: requiredText('First name', 100),
      lastName: requiredText('Last name', 100),
      gender: optionalText(50),
      email: z.string().trim().email('Enter a valid email address.').max(254),
      phone: z
        .string()
        .trim()
        .regex(/^03\d{9}$/, 'Enter an 11-digit mobile number starting with 03.'),
      countries: countriesSchema,
      field: requiredText('Field', 80),
      selectedJobIds: z
        .array(z.string().regex(/^occupation-\d{3}$/))
        .min(1, 'Select at least one occupation.')
        .max(3, 'Select no more than three occupations.')
        .refine((ids) => new Set(ids).size === ids.length, 'Selected occupations must be unique.'),
      cvPathType: cvPathTypeSchema,
    })
    .strict()
    .superRefine((application, context) => {
      const selectedField = jobFieldsById.get(application.field);
      if (!selectedField) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a recognized job field.',
          path: ['field'],
        });
      }
      const allowedIds = new Set(occupationsForField(application.field).map((job) => job.id));
      if (application.selectedJobIds.some((id) => !allowedIds.has(id))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['selectedJobIds'],
          message: 'Select active occupations matching your job field.',
        });
      }
    });
}

export const applicationFieldsSchema = createApplicationFieldsSchema();

export type ApplicationFieldsInput = z.input<typeof applicationFieldsSchema>;
export type ApplicationFields = z.output<typeof applicationFieldsSchema>;
