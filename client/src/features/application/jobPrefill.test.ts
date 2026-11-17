import { describe, expect, it } from 'vitest';
import { jobTaxonomy, occupationDirectorySeed, occupationsForField } from '@rozgar-links/shared';
import { getJobPrefill } from './jobPrefill';

describe('job application preselection', () => {
  it('resolves every directory occupation to a valid application field', () => {
    for (const job of occupationDirectorySeed.occupations) {
      const prefill = getJobPrefill(new URLSearchParams({ job: job.id }), jobTaxonomy);
      expect(prefill.selectedJobIds).toEqual([job.id]);
      expect(occupationsForField(prefill.field).map((item) => item.id)).toContain(job.id);
    }
  });

  it.each([
    ['occupation-021', 'drivers-and-transport'],
    ['occupation-039', 'security'],
    ['occupation-051', 'engineering'],
    ['occupation-058', 'healthcare'],
    ['occupation-061', 'information-technology'],
  ])('chooses a relevant field for %s', (job, field) => {
    expect(getJobPrefill(new URLSearchParams({ job }), jobTaxonomy)).toEqual({
      field,
      selectedJobIds: [job],
    });
  });

  it('honors a compatible explicit field and replaces an incompatible one', () => {
    expect(
      getJobPrefill(new URLSearchParams('job=occupation-021&field=logistics'), jobTaxonomy).field,
    ).toBe('logistics');
    expect(
      getJobPrefill(new URLSearchParams('job=occupation-021&field=healthcare'), jobTaxonomy).field,
    ).toBe('drivers-and-transport');
  });

  it.each(['occupation-999', '<script>', 'occupation-001,occupation-002', ''])(
    'ignores an invalid job parameter: %s',
    (job) => {
      expect(getJobPrefill(new URLSearchParams({ job }), jobTaxonomy)).toEqual({
        field: '',
        selectedJobIds: [],
      });
    },
  );

  it('preserves ordinary and field-only application entry', () => {
    expect(getJobPrefill(new URLSearchParams(), jobTaxonomy)).toEqual({
      field: '',
      selectedJobIds: [],
    });
    expect(getJobPrefill(new URLSearchParams('field=education&job=unknown'), jobTaxonomy)).toEqual({
      field: 'education',
      selectedJobIds: [],
    });
  });
});
