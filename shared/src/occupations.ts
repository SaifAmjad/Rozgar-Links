import { z } from 'zod';
import seed from '../occupations.seed.json' with { type: 'json' };
import additionalOccupations from '../applicationOccupations.json' with { type: 'json' };

// Application choices reuse the directory plus curated roles for fields missing there.
// Supplemental roles are preferences, not vacancies, and have no invented salary or country data.
export const occupationDirectorySeed = seed;
export const applicationOccupations = z
  .array(
    z.object({
      id: z.string().regex(/^occupation-\d{3}$/),
      titleEn: z.string().min(1),
      titleUr: z.string().min(1),
      categoryId: z.string().min(1),
    }),
  )
  .min(1)
  .refine(
    (occupations) =>
      new Set(occupations.map((occupation) => occupation.id)).size === occupations.length,
    'Application occupation IDs must be unique.',
  )
  .parse([...seed.occupations, ...additionalOccupations])
  .map((occupation) => ({ ...occupation, isActive: true }));

const ids = (...numbers: number[]) =>
  numbers.map((number) => `occupation-${String(number).padStart(3, '0')}`);
const range = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) => first + index);

// Explicit editorial mapping: taxonomy and directory category IDs are NOT interchangeable.
// Security (039) is intentionally excluded from hospitality despite its directory category.
// Education uses curated application-only roles; the public directory remains unchanged.
export const fieldOccupationIds: Readonly<Record<string, readonly string[]>> = {
  construction: ids(...range(1, 20), 51, 53, 54, 57),
  hospitality: ids(...range(32, 38)),
  healthcare: ids(58, 59, 60),
  'information-technology': ids(61, 62, 63, 64),
  'oil-and-gas': ids(12, 18, 19, 20, 52, 55),
  logistics: ids(21, 24, 26, 27, 47),
  retail: ids(...range(40, 44)),
  'drivers-and-transport': ids(...range(21, 31)),
  security: ids(39),
  engineering: ids(...range(51, 57)),
  administration: ids(45, 46, 48, 49, 50),
  education: ids(...range(65, 72)),
};

export function occupationsForField(field: string) {
  const allowed = fieldOccupationIds[field] ?? [];
  return applicationOccupations.filter(
    (occupation) => occupation.isActive && allowed.includes(occupation.id),
  );
}
