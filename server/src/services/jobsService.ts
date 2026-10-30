import {
  jobsResponseSchema,
  type JobsResponse,
  type JobsSort,
  type SalaryBandId,
} from '@rozgar-links/shared';

import {
  DIRECTORY_COUNTRIES,
  SALARY_BANDS,
  toPublicOccupation,
  type OccupationDirectoryRecord,
} from '../jobs/occupationDirectory.js';
import type { JobProvider } from '../providers/JobProvider.js';
import {
  JobsRepository,
  type JobsCache,
  type JobsCacheRepository,
} from '../repositories/jobsRepository.js';

const DAY_IN_MS = 86_400_000;

export interface JobsQuery {
  category?: string;
  country?: OccupationDirectoryRecord['countryIds'][number];
  customMax?: number;
  customMin?: number;
  designation?: string;
  language: 'en' | 'ur';
  limit: number;
  page: number;
  q?: string;
  salaryBands: SalaryBandId[];
  sort: JobsSort;
}

interface JobsServiceOptions {
  cacheTtlMs?: number;
  now?: () => Date;
  provider: JobProvider;
  repository?: JobsCacheRepository;
}

export class JobsUnavailableError extends Error {
  constructor() {
    super('No occupation directory is currently available.');
    this.name = 'JobsUnavailableError';
  }
}

export class JobsService {
  private readonly cacheTtlMs: number;
  private readonly now: () => Date;
  private readonly repository: JobsCacheRepository;

  constructor({
    cacheTtlMs = DAY_IN_MS,
    now = () => new Date(),
    provider,
    repository = new JobsRepository(),
  }: JobsServiceOptions) {
    this.cacheTtlMs = cacheTtlMs;
    this.now = now;
    this.provider = provider;
    this.repository = repository;
  }

  private readonly provider: JobProvider;

  async refresh(): Promise<JobsCache> {
    try {
      const catalog = await this.provider.fetchJobs();
      const cache = {
        version: 2 as const,
        provider: this.provider.descriptor,
        refreshedAt: this.now().toISOString(),
        catalog,
      };
      await this.repository.save(cache);
      return cache;
    } catch {
      throw new JobsUnavailableError();
    }
  }

  async getJobs(query: JobsQuery): Promise<JobsResponse> {
    const cached = await this.repository.read();
    const refreshedAt = cached.cache ? new Date(cached.cache.refreshedAt).getTime() : 0;
    const isFresh =
      cached.cache !== undefined &&
      !cached.recoveredFromMemory &&
      this.now().getTime() - refreshedAt < this.cacheTtlMs;
    let cache = cached.cache;
    let isStale = cached.recoveredFromMemory;

    if (!isFresh) {
      try {
        cache = await this.refresh();
        isStale = false;
      } catch (error) {
        if (!cache) throw error;
        isStale = true;
      }
    }

    if (!cache) throw new JobsUnavailableError();

    const categoryMap = new Map(
      cache.catalog.categories.map((category) => [category.id, category]),
    );
    const applyFilters = (
      occupations: OccupationDirectoryRecord[],
      excluded?: 'category' | 'salary',
    ) => {
      const searchTerm = query.q?.trim().toLocaleLowerCase(query.language);
      const selectedGroups = new Set(
        SALARY_BANDS.filter((band) => query.salaryBands.includes(band.id)).map(
          (band) => band.group,
        ),
      );

      return occupations
        .filter(
          (occupation) =>
            excluded === 'category' || !query.category || occupation.categoryId === query.category,
        )
        .filter(
          (occupation) =>
            excluded === 'salary' ||
            selectedGroups.size === 0 ||
            selectedGroups.has(occupation.salaryGroup),
        )
        .filter((occupation) => !query.designation || occupation.slug === query.designation)
        .filter((occupation) => !query.country || occupation.countryIds.includes(query.country))
        .filter((occupation) => {
          if (query.customMin === undefined && query.customMax === undefined) return true;
          const selectedMin = query.customMin ?? 0;
          const selectedMax = query.customMax ?? Number.POSITIVE_INFINITY;
          return (
            occupation.salaryMin <= selectedMax &&
            (occupation.salaryMax === null || occupation.salaryMax >= selectedMin)
          );
        })
        .filter((occupation) => {
          if (!searchTerm) return true;
          return [occupation.titleEn, occupation.titleUr]
            .map((value) => value.toLocaleLowerCase(query.language))
            .some((value) => value.includes(searchTerm));
        });
    };

    const filtered = applyFilters(cache.catalog.occupations);
    const sorted = [...filtered].sort((left, right) => {
      const stable = left.sortOrder - right.sortOrder;
      if (query.sort === 'salary-low-high') return left.salaryMin - right.salaryMin || stable;
      if (query.sort === 'salary-high-low') {
        const leftMaximum = left.salaryMax ?? Number.POSITIVE_INFINITY;
        const rightMaximum = right.salaryMax ?? Number.POSITIVE_INFINITY;
        return rightMaximum - leftMaximum || right.salaryMin - left.salaryMin || stable;
      }
      if (query.sort === 'title') {
        const leftTitle = query.language === 'ur' ? left.titleUr : left.titleEn;
        const rightTitle = query.language === 'ur' ? right.titleUr : right.titleEn;
        return leftTitle.localeCompare(rightTitle, query.language) || stable;
      }
      if (query.sort === 'category') {
        const leftCategory = categoryMap.get(left.categoryId);
        const rightCategory = categoryMap.get(right.categoryId);
        return (leftCategory?.sortOrder ?? 0) - (rightCategory?.sortOrder ?? 0) || stable;
      }
      return stable;
    });

    const total = sorted.length;
    const start = (query.page - 1) * query.limit;
    const items = sorted
      .slice(start, start + query.limit)
      .map((occupation) => toPublicOccupation(occupation, categoryMap));
    const categoryBase = applyFilters(cache.catalog.occupations, 'category');
    const salaryBase = applyFilters(cache.catalog.occupations, 'salary');

    return jobsResponseSchema.parse({
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      lastUpdated: cache.refreshedAt,
      sort: query.sort,
      facets: {
        categories: cache.catalog.categories.map((category) => ({
          ...category,
          count: categoryBase.filter((occupation) => occupation.categoryId === category.id).length,
        })),
        designations: cache.catalog.occupations
          .slice()
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((occupation) => ({
            slug: occupation.slug,
            titleEn: occupation.titleEn,
            titleUr: occupation.titleUr,
            categoryId: occupation.categoryId,
          })),
        salaryBands: SALARY_BANDS.map(({ group, ...band }) => ({
          ...band,
          count: salaryBase.filter((occupation) => occupation.salaryGroup === group).length,
        })),
        countries: DIRECTORY_COUNTRIES.map((country) => {
          const count = cache.catalog.occupations.filter((occupation) =>
            occupation.countryIds.includes(country.id),
          ).length;
          return { ...country, enabled: count > 0, count };
        }),
      },
      provenance: {
        kind: 'directory',
        source: cache.provider.label,
        isStale,
        notice:
          'Country assignments are random samples. Salary ranges are indicative monthly figures in SAR, not verified vacancies or guaranteed employer offers.',
      },
    });
  }
}
