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
  nationalId: '12345-1234567-1',
  email: 'applicant@example.invalid',
  phone: '03001234567',
  currentCity: 'Test City',
  countries: ['saudi-arabia'],
  field: 'construction',
  yearsExperience: 4,
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

  it('accepts only an 11-digit Pakistani mobile number starting with 03', () => {
    expect(parseWith({ phone: '03001234567' }).success).toBe(true);
    expect(issuePaths(parseWith({ phone: '+923001234567' }))).toContain('phone');
    expect(issuePaths(parseWith({ phone: '0300123456' }))).toContain('phone');
    expect(issuePaths(parseWith({ phone: '04001234567' }))).toContain('phone');
  });

  it('requires the standard CNIC structure', () => {
    expect(parseWith({ nationalId: '12345-1234567-1' }).success).toBe(true);
    expect(issuePaths(parseWith({ nationalId: '1234512345671' }))).toContain('nationalId');
    expect(issuePaths(parseWith({ nationalId: '12345-1234567-A' }))).toContain('nationalId');
  });

  it('rejects an unknown field', () => {
    const result = parseWith({ field: 'unknown-field' });

    expect(issuePaths(result)).toContain('field');
  });

  it('does not coerce an empty experience value to zero', () => {
    const result = parseWith({ yearsExperience: '' });

    expect(issuePaths(result)).toContain('yearsExperience');
  });
});
