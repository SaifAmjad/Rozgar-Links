import { describe, expect, it } from 'vitest';

import { jobTaxonomySchema } from './schemas/taxonomy.js';
import { jobTaxonomy } from './taxonomy.js';

const requiredFieldIds = [
  'construction',
  'hospitality',
  'healthcare',
  'information-technology',
  'oil-and-gas',
  'logistics',
  'retail',
  'drivers-and-transport',
  'security',
  'engineering',
  'administration',
  'education',
];

describe('job taxonomy', () => {
  it('contains every required field with 8–15 genuine roles and one Other option', () => {
    expect(jobTaxonomy.fields.map((field) => field.id)).toEqual(requiredFieldIds);

    for (const field of jobTaxonomy.fields) {
      const genuineRoles = field.roles.filter((role) => role.id !== 'other');
      expect(genuineRoles.length).toBeGreaterThanOrEqual(8);
      expect(genuineRoles.length).toBeLessThanOrEqual(15);
      expect(field.roles.filter((role) => role.id === 'other')).toEqual([
        { id: 'other', label: 'Other' },
      ]);
    }
  });

  it('uses unique field IDs and globally unique genuine role IDs', () => {
    const fieldIds = jobTaxonomy.fields.map((field) => field.id);
    const genuineRoleIds = jobTaxonomy.fields.flatMap((field) =>
      field.roles.filter((role) => role.id !== 'other').map((role) => role.id),
    );

    expect(new Set(fieldIds).size).toBe(fieldIds.length);
    expect(new Set(genuineRoleIds).size).toBe(genuineRoleIds.length);
  });

  it('rejects duplicate roles in a catalog fixture', () => {
    const invalidTaxonomy = structuredClone(jobTaxonomy);
    invalidTaxonomy.fields[0]?.roles.push({ id: 'mason', label: 'Duplicate Mason' });

    const result = jobTaxonomySchema.safeParse(invalidTaxonomy);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('unique'))).toBe(true);
    }
  });

  it('rejects duplicate field IDs and empty labels', () => {
    const duplicateFieldTaxonomy = structuredClone(jobTaxonomy);
    const emptyLabelTaxonomy = structuredClone(jobTaxonomy);
    const firstField = duplicateFieldTaxonomy.fields[0];

    if (firstField) {
      duplicateFieldTaxonomy.fields[11] = structuredClone(firstField);
    }
    if (emptyLabelTaxonomy.fields[0]?.roles[0]) {
      emptyLabelTaxonomy.fields[0].roles[0].label = '';
    }

    expect(jobTaxonomySchema.safeParse(duplicateFieldTaxonomy).success).toBe(false);
    expect(jobTaxonomySchema.safeParse(emptyLabelTaxonomy).success).toBe(false);
  });

  it('accepts a stable new-role fixture without changing existing IDs', () => {
    const extendedTaxonomy = structuredClone(jobTaxonomy);
    extendedTaxonomy.fields[0]?.roles.splice(-1, 0, {
      id: 'heritage-restoration-mason',
      label: 'Heritage Restoration Mason',
    });

    const result = jobTaxonomySchema.safeParse(extendedTaxonomy);

    expect(result.success).toBe(true);
    expect(jobTaxonomy.fields[0]?.roles[0]?.id).toBe('mason');
  });
});
