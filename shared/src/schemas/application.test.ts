import { describe, expect, it } from 'vitest';

import {
  createApplicationFieldsSchema,
  gulfCountries,
  type ApplicationFieldsInput,
} from './application.js';

const applicationSchema = createApplicationFieldsSchema();

const validApplication: ApplicationFieldsInput = {
  firstName: 'Test',
  lastName: 'Applicant',
  email: 'applicant@example.invalid',
  phone: '03001234567',
  countries: ['saudi-arabia'],
  field: 'construction',
  selectedJobIds: ['occupation-001'],
  cvPathType: 'new_cv_required',
};

function parseWith(overrides: Partial<ApplicationFieldsInput> = {}) {
  return applicationSchema.safeParse({ ...validApplication, ...overrides });
}

function issuePaths(result: ReturnType<typeof parseWith>) {
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('applicationFieldsSchema', () => {
  it('accepts the reduced personal details and expands All Gulf', () => {
    const result = parseWith({
      countries: ['all-gulf', 'qatar'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countries).toEqual(gulfCountries);
    }
  });

  it('accepts only an 11-digit Pakistani mobile number starting with 03', () => {
    expect(parseWith({ phone: '03001234567' }).success).toBe(true);
    expect(issuePaths(parseWith({ phone: '+923001234567' }))).toContain('phone');
    expect(issuePaths(parseWith({ phone: '0300123456' }))).toContain('phone');
    expect(issuePaths(parseWith({ phone: '04001234567' }))).toContain('phone');
  });

  it('rejects an unknown field', () => {
    const result = parseWith({ field: 'unknown-field' });

    expect(issuePaths(result)).toContain('field');
  });
  it('accepts education occupations only for the education field', () => {
    expect(
      parseWith({ field: 'education', selectedJobIds: ['occupation-065', 'occupation-070'] })
        .success,
    ).toBe(true);
    expect(
      issuePaths(parseWith({ field: 'construction', selectedJobIds: ['occupation-065'] })),
    ).toContain('selectedJobIds');
    expect(
      issuePaths(parseWith({ field: 'education', selectedJobIds: ['occupation-001'] })),
    ).toContain('selectedJobIds');
  });

  it('requires one to three unique matching occupations', () => {
    expect(
      parseWith({ selectedJobIds: ['occupation-001', 'occupation-002', 'occupation-003'] }).success,
    ).toBe(true);
    for (const selectedJobIds of [
      [],
      ['occupation-001', 'occupation-001'],
      ['occupation-999'],
      ['occupation-058'],
      ['occupation-001', 'occupation-002', 'occupation-003', 'occupation-004'],
    ]) {
      expect(issuePaths(parseWith({ selectedJobIds }))).toContain('selectedJobIds');
    }
  });
  it('rejects unsupported journeys, frontend verification claims and removed fields', () => {
    expect(parseWith({ cvPathType: 'existing_rozgar_cv' }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...validApplication, cvPathType: 'free' }).success).toBe(
      false,
    );
    for (const extra of [
      { verified: true },
      { cvReference: 'forged' },
      { yearsExperience: 4 },
      { nationalId: 'removed' },
    ]) {
      expect(applicationSchema.safeParse({ ...validApplication, ...extra }).success).toBe(false);
    }
  });
});
