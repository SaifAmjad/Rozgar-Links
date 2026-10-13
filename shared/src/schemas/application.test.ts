import { describe, expect, it } from 'vitest';

import {
  createApplicationFieldsSchema,
  gulfCountries,
  type ApplicationFieldsInput,
} from './application.js';

const referenceDate = new Date('2026-10-13T12:00:00.000Z');
const applicationSchema = createApplicationFieldsSchema({ now: () => referenceDate });

const validApplication: ApplicationFieldsInput = {
  firstName: 'Test',
  lastName: 'Applicant',
  dateOfBirth: '2000-01-15',
  nationality: 'Pakistan',
  nationalId: '12345-1234567-1',
  passportNumber: 'TEST-PASSPORT-1',
  passportExpiry: '2027-04-13',
  email: 'applicant@example.invalid',
  phone: '+923001234567',
  currentCity: 'Test City',
  currentCountry: 'Pakistan',
  countries: ['saudi-arabia'],
  field: 'construction',
  roles: ['mason'],
  yearsExperience: 4,
  highestEducation: 'Secondary school',
  languages: [{ language: 'Urdu', level: 'fluent' }],
  hasDrivingLicence: false,
  willingToRelocate: true,
  skills: ['Blueprint reading'],
  transactionReference: 'DEMO-TRANSACTION-1',
  paymentDate: '2026-10-13',
  acceptTerms: true,
  confirmAccuracy: true,
  acceptFeePolicy: true,
};

function parseWith(overrides: Partial<ApplicationFieldsInput> = {}) {
  return applicationSchema.safeParse({ ...validApplication, ...overrides });
}

function issuePaths(result: ReturnType<typeof parseWith>) {
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('applicationFieldsSchema', () => {
  it('accepts an applicant on their eighteenth birthday and expands All Gulf', () => {
    const result = parseWith({
      dateOfBirth: '2008-10-13',
      countries: ['all-gulf', 'qatar'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countries).toEqual(gulfCountries);
    }
  });

  it('rejects an applicant who is still 17', () => {
    const result = parseWith({ dateOfBirth: '2008-10-14' });

    expect(issuePaths(result)).toContain('dateOfBirth');
  });

  it('requires passport validity through six calendar months', () => {
    expect(parseWith({ passportExpiry: '2027-04-13' }).success).toBe(true);
    expect(issuePaths(parseWith({ passportExpiry: '2027-04-12' }))).toContain('passportExpiry');
  });

  it('handles month-end passport validity by calendar date', () => {
    const monthEndSchema = createApplicationFieldsSchema({
      now: () => new Date('2026-08-31T12:00:00.000Z'),
    });
    const result = monthEndSchema.safeParse({
      ...validApplication,
      paymentDate: '2026-08-31',
      passportExpiry: '2027-02-28',
    });

    expect(result.success).toBe(true);
  });

  it('requires Pakistani applicants to use the CNIC format', () => {
    const result = parseWith({ nationalId: '1234512345671' });

    expect(issuePaths(result)).toContain('nationalId');
  });

  it('does not assume a CNIC format for another nationality', () => {
    const result = parseWith({ nationality: 'Emirati', nationalId: 'UAE-DEMO-ID' });

    expect(result.success).toBe(true);
  });

  it('rejects a role that does not belong to the selected field', () => {
    const result = parseWith({ field: 'construction', roles: ['registered-nurse'] });

    expect(issuePaths(result)).toContain('roles.0');
  });

  it('rejects an unknown field', () => {
    const result = parseWith({ field: 'unknown-field' });

    expect(issuePaths(result)).toContain('field');
  });

  it('requires a description when Other is selected', () => {
    expect(issuePaths(parseWith({ roles: ['other'] }))).toContain('otherRole');
    expect(parseWith({ roles: ['other'], otherRole: 'Stone restoration specialist' }).success).toBe(
      true,
    );
  });

  it('validates salary ordering and currency', () => {
    const unordered = parseWith({
      expectedSalaryMin: 5_000,
      expectedSalaryMax: 4_000,
      salaryCurrency: 'SAR',
    });
    const missingCurrency = parseWith({ expectedSalaryMin: 5_000 });

    expect(issuePaths(unordered)).toContain('expectedSalaryMax');
    expect(issuePaths(missingCurrency)).toContain('salaryCurrency');
  });

  it('normalizes a blank optional salary currency', () => {
    const result = parseWith({ salaryCurrency: '' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.salaryCurrency).toBeUndefined();
  });

  it('rejects a future payment date', () => {
    const result = parseWith({ paymentDate: '2026-10-14' });

    expect(issuePaths(result)).toContain('paymentDate');
  });

  it('requires the issuing country when a driving licence is declared', () => {
    const result = parseWith({ hasDrivingLicence: true });

    expect(issuePaths(result)).toContain('licenceCountry');
  });

  it.each(['acceptTerms', 'confirmAccuracy', 'acceptFeePolicy'] as const)(
    'requires the %s consent',
    (consent) => {
      const result = parseWith({ [consent]: false });

      expect(issuePaths(result)).toContain(consent);
    },
  );

  it('does not coerce an empty experience value to zero', () => {
    const result = parseWith({ yearsExperience: '' });

    expect(issuePaths(result)).toContain('yearsExperience');
  });
});
