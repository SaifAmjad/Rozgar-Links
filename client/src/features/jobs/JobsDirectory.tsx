import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterX, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { type JobsResponse, type JobsSort, type SalaryBandId } from '@rozgar-links/shared';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { TextInput } from '../../components/ui/TextInput';
import { useLanguage } from '../../i18n/useLanguage';
import { fetchJobs, type JobsFilters } from './api';
import { JobCard } from './JobCard';

const selectClasses =
  'min-h-12 min-w-0 w-full rounded-xl border bg-bg px-3 py-2.5 text-base text-text disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted sm:min-h-11 sm:text-sm';
const salaryBandIds: SalaryBandId[] = [
  'sar-1400-1600',
  'sar-1601-2200',
  'sar-2201-3000',
  'sar-3001-plus',
];
const salaryBandLabels: Record<SalaryBandId, string> = {
  'sar-1400-1600': 'SAR 1,400 – 1,600',
  'sar-1601-2200': 'SAR 1,601 – 2,200',
  'sar-2201-3000': 'SAR 2,201 – 3,000',
  'sar-3001-plus': 'SAR 3,001 – 6,000+',
};
const sortOptions: Array<{ value: JobsSort; label: string }> = [
  { value: 'directory-order', label: 'Default directory order' },
  { value: 'salary-low-high', label: 'Salary: Low to High' },
  { value: 'salary-high-low', label: 'Salary: High to Low' },
  { value: 'title', label: 'Job title: A to Z' },
  { value: 'category', label: 'Category' },
];

function JobsLoading() {
  const { t } = useLanguage();
  return (
    <div className="grid gap-5 md:grid-cols-2" role="status" aria-label={t('Loading occupations')}>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-72" key={index} />
      ))}
    </div>
  );
}

function optionalNumber(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export function JobsDirectory() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [jobs, setJobs] = useState<JobsResponse>();
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const selectedSalaryBands = useMemo(
    () =>
      (searchParams.get('salary') ?? '')
        .split(',')
        .filter((value): value is SalaryBandId => salaryBandIds.includes(value as SalaryBandId)),
    [searchParams],
  );
  const category = searchParams.get('category') ?? '';
  const designation = searchParams.get('designation') ?? '';
  const sort = (searchParams.get('sort') as JobsSort | null) ?? 'directory-order';
  const page = optionalNumber(searchParams.get('page')) ?? 1;
  const customMin = optionalNumber(searchParams.get('customMin'));
  const customMax = optionalNumber(searchParams.get('customMax'));

  const updateParameters = useCallback(
    (updates: Record<string, string | undefined>, keepPage = false) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!keepPage) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = search.trim();
      if (currentQuery !== nextQuery) updateParameters({ q: nextQuery || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [currentQuery, search, updateParameters]);

  useEffect(() => {
    const controller = new AbortController();
    const filters: JobsFilters = {
      language,
      limit: 12,
      page,
      sort,
      ...(currentQuery ? { q: currentQuery } : {}),
      ...(category ? { category } : {}),
      ...(designation ? { designation } : {}),
      ...(selectedSalaryBands.length ? { salary: selectedSalaryBands } : {}),
      ...(customMin !== undefined ? { customMin } : {}),
      ...(customMax !== undefined ? { customMax } : {}),
    };

    void fetchJobs(filters, controller.signal)
      .then((response) => {
        setError(false);
        setJobs(response);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setJobs(undefined);
        }
      });
    return () => controller.abort();
  }, [
    category,
    currentQuery,
    customMax,
    customMin,
    designation,
    language,
    page,
    requestVersion,
    selectedSalaryBands,
    sort,
  ]);

  const retry = useCallback(() => {
    setError(false);
    setJobs(undefined);
    setRequestVersion((version) => version + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const toggleSalary = (id: SalaryBandId) => {
    const next = selectedSalaryBands.includes(id)
      ? selectedSalaryBands.filter((value) => value !== id)
      : [...selectedSalaryBands, id];
    updateParameters({ salary: next.length ? next.join(',') : undefined });
  };

  const designationOptions =
    jobs?.facets.designations.filter((item) => !category || item.categoryId === category) ?? [];
  const categoryLabel = jobs?.facets.categories.find((item) => item.id === category);
  const designationLabel = jobs?.facets.designations.find((item) => item.slug === designation);
  const activeFilterCount =
    Number(Boolean(searchParams.get('q'))) +
    Number(Boolean(category)) +
    Number(Boolean(designation)) +
    selectedSalaryBands.length +
    Number(customMin !== undefined || customMax !== undefined);

  return (
    <div>
      <div className="rounded-2xl border bg-bg p-4 shadow-soft sm:p-5">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3.5 start-4 z-10 text-brand-green sm:bottom-3"
            size={20}
          />
          <TextInput
            inputClassName="ps-11 pe-3"
            label={t('Search by occupation')}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Try Electrician, Driver or an Urdu title')}
            type="search"
            value={search}
          />
        </div>

        <div className="mt-5 border-t pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" className="text-brand-green" size={19} />
              <h2 className="text-base">{t('Filter occupations')}</h2>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-bg">
                  {activeFilterCount}
                </span>
              ) : null}
            </div>
            {activeFilterCount > 0 ? (
              <button
                className="min-h-11 text-sm font-bold text-brand-blue hover:underline"
                onClick={clearFilters}
                type="button"
              >
                {t('Clear all')}
              </button>
            ) : null}
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <label className="min-w-0 space-y-2 text-sm font-bold text-primary">
              <span className="block">{t('Categories')}</span>
              <select
                className={selectClasses}
                onChange={(event) =>
                  updateParameters({
                    category: event.target.value || undefined,
                    designation: undefined,
                  })
                }
                value={category}
              >
                <option value="">
                  {t('All categories')} ({jobs?.facets.designations.length ?? 64})
                </option>
                {jobs?.facets.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {language === 'ur' ? item.nameUr : item.nameEn} ({item.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 space-y-2 text-sm font-bold text-primary">
              <span className="block">{t('Monthly salary')}</span>
              <select
                className={selectClasses}
                onChange={(event) =>
                  updateParameters({
                    salary: event.target.value || undefined,
                    customMin: undefined,
                    customMax: undefined,
                  })
                }
                value={selectedSalaryBands.length === 1 ? selectedSalaryBands[0] : ''}
              >
                <option value="">{t('All salary ranges')}</option>
                {jobs?.facets.salaryBands.map((band) => (
                  <option key={band.id} value={band.id}>
                    {salaryBandLabels[band.id]} ({band.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 space-y-2 text-sm font-bold text-primary">
              <span className="block">{t('Designation')}</span>
              <select
                className={selectClasses}
                onChange={(event) =>
                  updateParameters({ designation: event.target.value || undefined })
                }
                value={designation}
              >
                <option value="">{t('All designations')}</option>
                {designationOptions.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {language === 'ur' ? item.titleUr : item.titleEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 space-y-2 text-sm font-bold text-primary">
              <span className="block">{t('Country')}</span>
              <select
                aria-describedby="country-filter-note"
                className={selectClasses}
                disabled
                value=""
              >
                <option>{t('Country availability not yet verified')}</option>
                {jobs?.facets.countries.map((countryOption) => (
                  <option key={countryOption.id}>
                    {language === 'ur' ? countryOption.nameUr : countryOption.nameEn}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted" id="country-filter-note">
            {t('Country filtering will be enabled when verified associations are available.')}
          </p>
        </div>
      </div>

      <section aria-labelledby="occupation-results-heading" className="mt-5 min-w-0">
        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl" id="occupation-results-heading">
              {t('Occupation directory')}
            </h2>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {jobs
                ? t('{count} occupations found', { count: jobs.total })
                : t('Loading occupations')}
            </p>
          </div>
          <label className="w-full space-y-2 text-sm font-bold text-primary sm:w-auto sm:min-w-64">
            <span className="block">{t('Sort by')}</span>
            <select
              className={selectClasses}
              onChange={(event) => updateParameters({ sort: event.target.value as JobsSort })}
              value={sort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeFilterCount > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={t('Applied filters')}>
            {searchParams.get('q') ? (
              <FilterChip
                label={`${t('Search')}: ${searchParams.get('q')}`}
                onRemove={() => {
                  setSearch('');
                  updateParameters({ q: undefined });
                }}
              />
            ) : null}
            {categoryLabel ? (
              <FilterChip
                label={language === 'ur' ? categoryLabel.nameUr : categoryLabel.nameEn}
                onRemove={() => updateParameters({ category: undefined, designation: undefined })}
              />
            ) : null}
            {designationLabel ? (
              <FilterChip
                label={language === 'ur' ? designationLabel.titleUr : designationLabel.titleEn}
                onRemove={() => updateParameters({ designation: undefined })}
              />
            ) : null}
            {selectedSalaryBands.map((band) => (
              <FilterChip
                key={band}
                label={salaryBandLabels[band]}
                onRemove={() => toggleSalary(band)}
              />
            ))}
            {customMin !== undefined || customMax !== undefined ? (
              <FilterChip
                label={`SAR ${customMin ?? 0} – ${customMax ?? '∞'}`}
                onRemove={() => updateParameters({ customMin: undefined, customMax: undefined })}
              />
            ) : null}
            <button
              className="min-h-11 px-3 text-sm font-bold text-brand-blue hover:underline"
              onClick={clearFilters}
              type="button"
            >
              {t('Clear all')}
            </button>
          </div>
        ) : null}

        <div className="mt-6" aria-live="polite">
          {!jobs && !error ? <JobsLoading /> : null}
          {error ? (
            <Card className="text-center" role="alert">
              <h2 className="text-xl">{t('Occupation directory temporarily unavailable')}</h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
                {t('We could not load the occupation directory. Please try again.')}
              </p>
              <Button className="mt-5" onClick={retry} variant="outline">
                <RefreshCw aria-hidden="true" size={17} /> {t('Retry')}
              </Button>
            </Card>
          ) : null}

          {jobs?.items.length ? (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {jobs.items.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
            </>
          ) : null}

          {jobs && jobs.items.length === 0 ? (
            <Card className="border-dashed text-center">
              <FilterX aria-hidden="true" className="mx-auto text-brand-green" size={30} />
              <h2 className="mt-4 text-xl">{t('No matching occupations found')}</h2>
              <p className="mt-3 text-muted">
                {t('Try changing or clearing one or more filters.')}
              </p>
              <Button className="mt-5" onClick={clearFilters} variant="outline">
                {t('Clear all filters')}
              </Button>
            </Card>
          ) : null}

          {jobs && jobs.totalPages > 1 ? (
            <nav
              aria-label={t('Occupation results pagination')}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Button
                disabled={jobs.page <= 1}
                onClick={() => updateParameters({ page: String(jobs.page - 1) }, true)}
                variant="outline"
              >
                {t('Previous')}
              </Button>
              <span className="text-sm font-bold text-primary">
                {t('Page {page} of {total}', {
                  page: jobs.page,
                  total: jobs.totalPages,
                })}
              </span>
              <Button
                disabled={jobs.page >= jobs.totalPages}
                onClick={() => updateParameters({ page: String(jobs.page + 1) }, true)}
                variant="outline"
              >
                {t('Next')}
              </Button>
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useLanguage();
  return (
    <span className="inline-flex min-h-11 items-center gap-1 rounded-full border bg-bg ps-4 pe-1 text-sm font-semibold text-primary">
      <bdi>{label}</bdi>
      <button
        aria-label={t('Remove {filter}', { filter: label })}
        className="grid size-9 place-items-center rounded-full hover:bg-surface"
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </span>
  );
}
