import {
  applicationOccupations,
  occupationsForField,
  type JobTaxonomy,
} from '@rozgar-links/shared';

// Directory categories and application fields have different IDs. The existing
// field-to-occupation mapping remains authoritative for every preselection.
const preferredFieldsByCategory: Readonly<Record<string, string>> = {
  'construction-civil-trades': 'construction',
  'electrical-mep-solar': 'construction',
  'transport-drivers-auto': 'drivers-and-transport',
  'hospitality-food-services': 'hospitality',
  'retail-sales-merchandising': 'retail',
  'office-admin-accounts': 'administration',
  'engineering-technical-management': 'engineering',
  'healthcare-professionals': 'healthcare',
  'information-technology-software': 'information-technology',
};

export function getJobPrefill(params: URLSearchParams, taxonomy: JobTaxonomy) {
  const requestedField = taxonomy.fields.find((field) => field.id === params.get('field'));
  const job = applicationOccupations.find(
    (occupation) => occupation.isActive && occupation.id === params.get('job'),
  );
  if (!job) return { field: requestedField?.id ?? '', selectedJobIds: [] };

  const compatibleFields = taxonomy.fields.filter((field) =>
    occupationsForField(field.id).some((occupation) => occupation.id === job.id),
  );
  const field =
    compatibleFields.find((field) => field.id === requestedField?.id) ??
    compatibleFields.find((field) => field.id === preferredFieldsByCategory[job.categoryId]) ??
    compatibleFields[0];

  return field
    ? { field: field.id, selectedJobIds: [job.id] }
    : { field: requestedField?.id ?? '', selectedJobIds: [] };
}
