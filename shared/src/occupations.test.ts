import { describe, expect, it } from 'vitest';
import { applicationOccupations, fieldOccupationIds, occupationsForField } from './occupations.js';
import { jobTaxonomy } from './taxonomy.js';

describe('explicit application occupation mapping', () => {
  it('references only known taxonomy fields and active directory IDs', () => {
    expect(Object.keys(fieldOccupationIds).sort()).toEqual(
      jobTaxonomy.fields.map((field) => field.id).sort(),
    );
    const known = new Set(applicationOccupations.map((job) => job.id));
    expect(applicationOccupations).toHaveLength(72);
    expect(
      Object.values(fieldOccupationIds)
        .flat()
        .every((id) => known.has(id)),
    ).toBe(true);
    expect(new Set(Object.values(fieldOccupationIds).flat()).size).toBe(72);
    for (const field of jobTaxonomy.fields) {
      expect(occupationsForField(field.id).length).toBeGreaterThan(0);
    }
  });
  it('does not substitute hospitality or education occupations for security', () => {
    expect(occupationsForField('security').map((job) => job.id)).toEqual(['occupation-039']);
    expect(occupationsForField('hospitality').some((job) => job.id === 'occupation-039')).toBe(
      false,
    );
    expect(occupationsForField('education')).toHaveLength(8);
    expect(occupationsForField('education').every((job) => job.categoryId === 'education')).toBe(
      true,
    );
  });
});
