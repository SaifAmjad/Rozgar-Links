import { z } from 'zod';

import { jobFieldsById } from '../taxonomy.js';

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

const requiredNonnegativeNumber = (label: string, maximum: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce
      .number({
        invalid_type_error: `${label} is required.`,
        required_error: `${label} is required.`,
      })
      .finite()
      .nonnegative()
      .max(maximum),
  );

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day
  );
}

const isoDateSchema = z.string().refine(isValidIsoDate, 'Enter a valid date in YYYY-MM-DD format.');

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function calculateAge(dateOfBirth: Date, onDate: Date) {
  let age = onDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const birthdayHasPassed =
    onDate.getUTCMonth() > dateOfBirth.getUTCMonth() ||
    (onDate.getUTCMonth() === dateOfBirth.getUTCMonth() &&
      onDate.getUTCDate() >= dateOfBirth.getUTCDate());

  if (!birthdayHasPassed) age -= 1;
  return age;
}

const countriesSchema = z
  .array(z.enum([...gulfCountries, 'all-gulf']))
  .min(1, 'Select at least one Gulf country.')
  .transform((countries) =>
    countries.includes('all-gulf') ? [...gulfCountries] : [...new Set(countries)],
  );

interface ApplicationSchemaOptions {
  now?: () => Date;
}

export function createApplicationFieldsSchema({
  now = () => new Date(),
}: ApplicationSchemaOptions = {}) {
  return z
    .object({
      firstName: requiredText('First name', 100),
      lastName: requiredText('Last name', 100),
      dateOfBirth: isoDateSchema,
      gender: optionalText(50),
      nationalId: z
        .string()
        .trim()
        .regex(/^\d{5}-\d{7}-\d$/, 'Enter CNIC as #####-#######-#.'),
      email: z.string().trim().email('Enter a valid email address.').max(254),
      phone: z
        .string()
        .trim()
        .regex(/^03\d{9}$/, 'Enter an 11-digit mobile number starting with 03.'),
      currentCity: requiredText('Current city', 100),
      countries: countriesSchema,
      field: requiredText('Field', 80),
      yearsExperience: requiredNonnegativeNumber('Years of experience', 80),
    })
    .strict()
    .superRefine((application, context) => {
      const submissionDate = startOfUtcDay(now());
      const dateOfBirth = parseIsoDate(application.dateOfBirth);

      if (calculateAge(dateOfBirth, submissionDate) < 18) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Applicant must be at least 18 years old.',
          path: ['dateOfBirth'],
        });
      }

      const selectedField = jobFieldsById.get(application.field);
      if (!selectedField) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a recognized job field.',
          path: ['field'],
        });
      }
    });
}

export const applicationFieldsSchema = createApplicationFieldsSchema();

export type ApplicationFieldsInput = z.input<typeof applicationFieldsSchema>;
export type ApplicationFields = z.output<typeof applicationFieldsSchema>;
