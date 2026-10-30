import { describe, expect, it } from 'vitest';

import { occupationListingSchema } from './jobs.js';

const occupation = {
  id: 'occupation-001',
  slug: 'general-site-helper',
  titleEn: 'General Site Helper',
  titleUr: 'جنرل سائٹ ہیلپر',
  category: {
    id: 'construction',
    nameEn: 'Construction',
    nameUr: 'تعمیرات',
    sortOrder: 1,
  },
  salaryMin: 1400,
  salaryMax: 1550,
  salaryMaxOpenEnded: false,
  salaryCurrency: 'SAR',
  salaryPeriod: 'monthly',
  countryIds: [],
  recordType: 'occupation_directory',
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('occupation directory schemas', () => {
  it('accepts a localized occupation with numeric salary fields', () => {
    expect(occupationListingSchema.parse(occupation)).toEqual(occupation);
  });

  it('represents an open-ended salary with a null maximum', () => {
    const result = occupationListingSchema.parse({
      ...occupation,
      salaryMin: 4500,
      salaryMax: null,
      salaryMaxOpenEnded: true,
    });
    expect(result.salaryMax).toBeNull();
  });

  it('rejects inconsistent salary bounds', () => {
    expect(() =>
      occupationListingSchema.parse({
        ...occupation,
        salaryMax: null,
        salaryMaxOpenEnded: false,
      }),
    ).toThrow(/open-ended salaries/i);
  });
});
