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
export const languageLevels = ['basic', 'intermediate', 'advanced', 'fluent'] as const;

export const supportedCurrencySchema = z.enum(supportedCurrencies);

const requiredText = (label: string, maximum: number) =>
  z.string().trim().min(1, `${label} is required.`).max(maximum, `${label} is too long.`);

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maximum).optional(),
  );

const optionalNumber = (maximum: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().finite().nonnegative().max(maximum).optional(),
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

function addCalendarMonths(value: Date, months: number) {
  const targetYear = value.getUTCFullYear() + Math.floor((value.getUTCMonth() + months) / 12);
  const targetMonth = (value.getUTCMonth() + months) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(targetYear, targetMonth, Math.min(value.getUTCDate(), lastDayOfTargetMonth)),
  );
}

const countriesSchema = z
  .array(z.enum([...gulfCountries, 'all-gulf']))
  .min(1, 'Select at least one Gulf country.')
  .transform((countries) =>
    countries.includes('all-gulf') ? [...gulfCountries] : [...new Set(countries)],
  );

const rolesSchema = z
  .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
  .min(1, 'Select at least one role.')
  .transform((roles) => [...new Set(roles)]);

const languageSchema = z
  .object({
    language: requiredText('Language', 60),
    level: z.enum(languageLevels),
  })
  .strict();

const consentSchema = (message: string) => z.boolean().refine((accepted) => accepted, message);

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
      nationality: requiredText('Nationality', 80),
      nationalId: requiredText('National ID', 80),
      passportNumber: requiredText('Passport number', 40),
      passportExpiry: isoDateSchema,
      email: z.string().trim().email('Enter a valid email address.').max(254),
      phone: z
        .string()
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid E.164 phone number.'),
      currentCity: requiredText('Current city', 100),
      currentCountry: requiredText('Current country', 80),
      maritalStatus: optionalText(50),
      countries: countriesSchema,
      field: requiredText('Field', 80),
      roles: rolesSchema,
      otherRole: optionalText(100),
      yearsExperience: requiredNonnegativeNumber('Years of experience', 80),
      highestEducation: requiredText('Highest education', 120),
      lastJobTitle: optionalText(120),
      expectedSalaryMin: optionalNumber(10_000_000),
      expectedSalaryMax: optionalNumber(10_000_000),
      salaryCurrency: z.preprocess(
        (value) => (value === '' ? undefined : value),
        supportedCurrencySchema.optional(),
      ),
      preferredJoiningDate: z.preprocess(
        (value) => (value === '' ? undefined : value),
        isoDateSchema.optional(),
      ),
      languages: z.array(languageSchema).max(12).default([]),
      hasDrivingLicence: z.boolean(),
      licenceCountry: optionalText(80),
      willingToRelocate: z.boolean(),
      skills: z.array(requiredText('Skill', 80)).max(30).default([]),
      notes: optionalText(2_000),
      transactionReference: requiredText('Transaction reference', 120),
      paymentDate: isoDateSchema,
      acceptTerms: consentSchema('Accept the terms to continue.'),
      confirmAccuracy: consentSchema('Confirm that the information is accurate.'),
      acceptFeePolicy: consentSchema('Accept the fee and refund policy to continue.'),
    })
    .strict()
    .superRefine((application, context) => {
      const submissionDate = startOfUtcDay(now());
      const dateOfBirth = parseIsoDate(application.dateOfBirth);
      const passportExpiry = parseIsoDate(application.passportExpiry);
      const paymentDate = parseIsoDate(application.paymentDate);

      if (calculateAge(dateOfBirth, submissionDate) < 18) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Applicant must be at least 18 years old.',
          path: ['dateOfBirth'],
        });
      }

      if (passportExpiry < addCalendarMonths(submissionDate, 6)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passport must remain valid for at least six calendar months.',
          path: ['passportExpiry'],
        });
      }

      const normalizedNationality = application.nationality.toLowerCase();
      if (
        (normalizedNationality === 'pakistan' || normalizedNationality === 'pakistani') &&
        !/^\d{5}-\d{7}-\d$/.test(application.nationalId)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter CNIC as #####-#######-#.',
          path: ['nationalId'],
        });
      }

      const selectedField = jobFieldsById.get(application.field);
      if (!selectedField) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a recognized job field.',
          path: ['field'],
        });
      } else {
        const validRoleIds = new Set(selectedField.roles.map((role) => role.id));
        application.roles.forEach((roleId, index) => {
          if (!validRoleIds.has(roleId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Role ${roleId} does not belong to ${selectedField.label}.`,
              path: ['roles', index],
            });
          }
        });
      }

      if (application.roles.includes('other') && !application.otherRole) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Describe the other role.',
          path: ['otherRole'],
        });
      }

      if (
        application.expectedSalaryMin !== undefined &&
        application.expectedSalaryMax !== undefined &&
        application.expectedSalaryMin > application.expectedSalaryMax
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum salary must be greater than or equal to minimum salary.',
          path: ['expectedSalaryMax'],
        });
      }

      if (
        (application.expectedSalaryMin !== undefined ||
          application.expectedSalaryMax !== undefined) &&
        !application.salaryCurrency
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a currency for the expected salary.',
          path: ['salaryCurrency'],
        });
      }

      if (application.hasDrivingLicence && !application.licenceCountry) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter the country that issued the driving licence.',
          path: ['licenceCountry'],
        });
      }

      if (paymentDate > submissionDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Payment date cannot be in the future.',
          path: ['paymentDate'],
        });
      }
    });
}

export const applicationFieldsSchema = createApplicationFieldsSchema();

export type ApplicationFieldsInput = z.input<typeof applicationFieldsSchema>;
export type ApplicationFields = z.output<typeof applicationFieldsSchema>;
