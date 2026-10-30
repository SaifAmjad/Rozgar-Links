import { z } from 'zod';

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const localizedNameSchema = z.string().trim().min(1).max(160);

export const directoryCountrySchema = z
  .object({
    id: slugSchema,
    nameEn: localizedNameSchema,
    nameUr: localizedNameSchema,
    enabled: z.boolean(),
    count: z.number().int().nonnegative(),
  })
  .strict();

export const occupationCategorySchema = z
  .object({
    id: slugSchema,
    nameEn: localizedNameSchema,
    nameUr: localizedNameSchema,
    sortOrder: z.number().int().positive(),
  })
  .strict();

export const salaryBandIdSchema = z.enum([
  'sar-1400-1600',
  'sar-1601-2200',
  'sar-2201-3000',
  'sar-3001-plus',
]);

export const occupationListingSchema = z
  .object({
    id: slugSchema,
    slug: slugSchema,
    titleEn: localizedNameSchema,
    titleUr: localizedNameSchema,
    category: occupationCategorySchema,
    salaryMin: z.number().int().nonnegative(),
    salaryMax: z.number().int().nonnegative().nullable(),
    salaryMaxOpenEnded: z.boolean(),
    salaryCurrency: z.literal('SAR'),
    salaryPeriod: z.literal('monthly'),
    countryIds: z.array(slugSchema),
    recordType: z.literal('occupation_directory'),
    isActive: z.literal(true),
    sortOrder: z.number().int().positive(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine((occupation, context) => {
    if (occupation.salaryMaxOpenEnded !== (occupation.salaryMax === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Open-ended salaries must use a null maximum.',
        path: ['salaryMax'],
      });
    }

    if (occupation.salaryMax !== null && occupation.salaryMax < occupation.salaryMin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Salary maximum must not be below salary minimum.',
        path: ['salaryMax'],
      });
    }
  });

export const occupationCategoryFacetSchema = occupationCategorySchema.extend({
  count: z.number().int().nonnegative(),
});

export const designationFacetSchema = z
  .object({
    slug: slugSchema,
    titleEn: localizedNameSchema,
    titleUr: localizedNameSchema,
    categoryId: slugSchema,
  })
  .strict();

export const salaryBandFacetSchema = z
  .object({
    id: salaryBandIdSchema,
    minimum: z.number().int().nonnegative(),
    maximum: z.number().int().nonnegative().nullable(),
    count: z.number().int().nonnegative(),
  })
  .strict();

export const jobsFacetsSchema = z
  .object({
    categories: z.array(occupationCategoryFacetSchema).length(9),
    designations: z.array(designationFacetSchema).length(64),
    salaryBands: z.array(salaryBandFacetSchema).length(4),
    countries: z.array(directoryCountrySchema).length(6),
  })
  .strict();

export const jobsSortSchema = z.enum([
  'directory-order',
  'salary-low-high',
  'salary-high-low',
  'title',
  'category',
]);

export const jobsProvenanceSchema = z
  .object({
    kind: z.literal('directory'),
    source: z.string().trim().min(1).max(120),
    isStale: z.boolean(),
    notice: z.string().trim().min(1).max(280),
  })
  .strict();

export const jobsResponseSchema = z
  .object({
    items: z.array(occupationListingSchema),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    lastUpdated: z.string().datetime({ offset: true }),
    sort: jobsSortSchema,
    facets: jobsFacetsSchema,
    provenance: jobsProvenanceSchema,
  })
  .strict()
  .superRefine((response, context) => {
    if (response.items.length > response.limit || response.items.length > response.total) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page item counts are inconsistent.',
        path: ['items'],
      });
    }

    if (response.totalPages !== Math.ceil(response.total / response.limit)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total pages do not match total and limit.',
        path: ['totalPages'],
      });
    }

    if (new Set(response.items.map((occupation) => occupation.id)).size !== response.items.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Occupation IDs must be unique within a response.',
        path: ['items'],
      });
    }
  });

export const jobListingSchema = occupationListingSchema;

export type DirectoryCountry = z.infer<typeof directoryCountrySchema>;
export type OccupationCategory = z.infer<typeof occupationCategorySchema>;
export type SalaryBandId = z.infer<typeof salaryBandIdSchema>;
export type OccupationListing = z.infer<typeof occupationListingSchema>;
export type JobListing = OccupationListing;
export type JobsFacets = z.infer<typeof jobsFacetsSchema>;
export type JobsSort = z.infer<typeof jobsSortSchema>;
export type JobsProvenance = z.infer<typeof jobsProvenanceSchema>;
export type JobsResponse = z.infer<typeof jobsResponseSchema>;
