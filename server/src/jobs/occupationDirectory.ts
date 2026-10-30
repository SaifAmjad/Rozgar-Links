import {
  occupationCategorySchema,
  occupationListingSchema,
  type OccupationCategory,
  type OccupationListing,
  type SalaryBandId,
} from '@rozgar-links/shared';
import { z } from 'zod';

export const salaryGroupSchema = z.enum(['A', 'B', 'C', 'D']);

const seedOccupationSchema = z
  .object({
    id: z.string().regex(/^occupation-\d{3}$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleEn: z.string().trim().min(1).max(160),
    titleUr: z.string().trim().min(1).max(160),
    categoryId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    salaryMin: z.number().int().nonnegative(),
    salaryMax: z.number().int().nonnegative().nullable(),
    salaryMaxOpenEnded: z.boolean(),
    salaryGroup: salaryGroupSchema,
    sortOrder: z.number().int().min(1).max(64),
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

export const occupationSeedSchema = z
  .object({
    version: z.literal(1),
    publishedAt: z.string().datetime({ offset: true }),
    categories: z.array(occupationCategorySchema).length(9),
    occupations: z.array(seedOccupationSchema).length(64),
  })
  .strict()
  .superRefine((seed, context) => {
    const categoryIds = new Set(seed.categories.map((category) => category.id));
    const uniqueSets = [
      seed.occupations.map((occupation) => occupation.id),
      seed.occupations.map((occupation) => occupation.slug),
      seed.occupations.map((occupation) => String(occupation.sortOrder)),
    ];

    if (uniqueSets.some((values) => new Set(values).size !== values.length)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Occupation IDs, slugs and sort orders must be unique.',
        path: ['occupations'],
      });
    }

    if (seed.occupations.some((occupation) => !categoryIds.has(occupation.categoryId))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Every occupation must reference a known category.',
        path: ['occupations'],
      });
    }
  });

export const occupationDirectoryRecordSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleEn: z.string().trim().min(1).max(160),
    titleUr: z.string().trim().min(1).max(160),
    categoryId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    salaryMin: z.number().int().nonnegative(),
    salaryMax: z.number().int().nonnegative().nullable(),
    salaryMaxOpenEnded: z.boolean(),
    salaryCurrency: z.literal('SAR'),
    salaryPeriod: z.literal('monthly'),
    salaryGroup: salaryGroupSchema,
    countryIds: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    recordType: z.literal('occupation_directory'),
    isActive: z.literal(true),
    sortOrder: z.number().int().positive(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const occupationCatalogSchema = z
  .object({
    categories: z.array(occupationCategorySchema).length(9),
    occupations: z.array(occupationDirectoryRecordSchema).length(64),
  })
  .strict();

export type OccupationDirectoryRecord = z.infer<typeof occupationDirectoryRecordSchema>;
export type OccupationCatalog = z.infer<typeof occupationCatalogSchema>;
export type SalaryGroup = z.infer<typeof salaryGroupSchema>;

export const SALARY_BANDS: ReadonlyArray<{
  id: SalaryBandId;
  minimum: number;
  maximum: number | null;
  group: SalaryGroup;
}> = [
  { id: 'sar-1400-1600', minimum: 1400, maximum: 1600, group: 'A' },
  { id: 'sar-1601-2200', minimum: 1601, maximum: 2200, group: 'B' },
  { id: 'sar-2201-3000', minimum: 2201, maximum: 3000, group: 'C' },
  { id: 'sar-3001-plus', minimum: 3001, maximum: null, group: 'D' },
];

export const DIRECTORY_COUNTRIES = [
  { id: 'saudi-arabia', nameEn: 'Saudi Arabia', nameUr: 'سعودی عرب' },
  { id: 'united-arab-emirates', nameEn: 'United Arab Emirates', nameUr: 'متحدہ عرب امارات' },
  { id: 'qatar', nameEn: 'Qatar', nameUr: 'قطر' },
  { id: 'kuwait', nameEn: 'Kuwait', nameUr: 'کویت' },
  { id: 'oman', nameEn: 'Oman', nameUr: 'عمان' },
] as const;

export const DIRECTORY_COUNTRY_IDS = [
  'saudi-arabia',
  'united-arab-emirates',
  'qatar',
  'kuwait',
  'oman',
] as const;

export const DIRECTORY_CATEGORY_IDS = [
  'construction-civil-trades',
  'electrical-mep-solar',
  'transport-drivers-auto',
  'hospitality-food-services',
  'retail-sales-merchandising',
  'office-admin-accounts',
  'engineering-technical-management',
  'healthcare-professionals',
  'information-technology-software',
] as const;

export function parseOccupationSeed(input: unknown): OccupationCatalog {
  const seed = occupationSeedSchema.parse(input);
  const occupations = seed.occupations.map((occupation) => ({
    ...occupation,
    salaryCurrency: 'SAR' as const,
    salaryPeriod: 'monthly' as const,
    countryIds: [],
    recordType: 'occupation_directory' as const,
    isActive: true as const,
    createdAt: seed.publishedAt,
    updatedAt: seed.publishedAt,
  }));

  return occupationCatalogSchema.parse({
    categories: seed.categories,
    occupations,
  });
}

export function toPublicOccupation(
  occupation: OccupationDirectoryRecord,
  categories: ReadonlyMap<string, OccupationCategory>,
): OccupationListing {
  const category = categories.get(occupation.categoryId);
  if (!category) throw new Error('Occupation category is unavailable.');

  const publicOccupation = Object.fromEntries(
    Object.entries(occupation).filter(([key]) => key !== 'categoryId' && key !== 'salaryGroup'),
  );
  return occupationListingSchema.parse({ ...publicOccupation, category });
}
