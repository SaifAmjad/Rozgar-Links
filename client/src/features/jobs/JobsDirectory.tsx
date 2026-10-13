import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FilterX, RefreshCw, Search } from 'lucide-react';

import { gccCountryNames, jobTaxonomy, type JobsResponse } from '@rozgar-links/shared';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { TextInput } from '../../components/ui/TextInput';
import { fetchJobs, type JobsFilters } from './api';
import { JobCard } from './JobCard';

const selectClasses =
  'min-h-11 w-full rounded-xl border bg-bg px-4 py-2.5 text-text disabled:cursor-not-allowed disabled:bg-surface';

function JobsLoading() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading jobs"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-80" key={index} />
      ))}
    </div>
  );
}

export function JobsDirectory() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [field, setField] = useState('');
  const [filters, setFilters] = useState<JobsFilters>({ limit: 12, page: 1 });
  const [jobs, setJobs] = useState<JobsResponse>();
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setError(false);
    setJobs(undefined);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchJobs(filters, controller.signal)
      .then((response) => setJobs(response))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setJobs(undefined);
        }
      });

    return () => controller.abort();
  }, [filters, requestVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setJobs(undefined);
    setFilters({
      limit: 12,
      page: 1,
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(country ? { country } : {}),
      ...(field ? { field } : {}),
    });
  }

  function clearFilters() {
    setSearch('');
    setCountry('');
    setField('');
    setError(false);
    setJobs(undefined);
    setFilters({ limit: 12, page: 1 });
  }

  function changePage(page: number) {
    setJobs(undefined);
    setFilters((current) => ({ ...current, page }));
  }

  return (
    <>
      <Card className="bg-surface">
        <form onSubmit={applyFilters}>
          <div className="flex items-center gap-3">
            <Search aria-hidden="true" className="text-brand-green" size={22} />
            <h2 className="text-xl">Search and filters</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <TextInput
              label="Search jobs"
              maxLength={80}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, company or city"
              type="search"
              value={search}
            />
            <label className="space-y-2 text-sm font-bold text-primary">
              <span className="block">Country</span>
              <select
                className={selectClasses}
                onChange={(event) => setCountry(event.target.value)}
                value={country}
              >
                <option value="">All Gulf countries</option>
                {gccCountryNames.map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-bold text-primary">
              <span className="block">Field</span>
              <select
                className={selectClasses}
                onChange={(event) => setField(event.target.value)}
                value={field}
              >
                <option value="">All fields</option>
                {jobTaxonomy.fields.map((jobField) => (
                  <option key={jobField.id} value={jobField.id}>
                    {jobField.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit">
              <Search aria-hidden="true" size={17} /> Search listings
            </Button>
            <Button onClick={clearFilters} type="button" variant="ghost">
              <FilterX aria-hidden="true" size={17} /> Clear filters
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8" aria-live="polite">
        {!jobs && !error ? <JobsLoading /> : null}

        {error ? (
          <Card className="text-center" role="alert">
            <h2 className="text-xl">Job directory temporarily unavailable</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
              No listings were substituted. Please retry the sample catalog request.
            </p>
            <Button className="mt-5" onClick={retry} variant="outline">
              <RefreshCw aria-hidden="true" size={17} /> Retry
            </Button>
          </Card>
        ) : null}

        {jobs ? (
          <>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-bold text-primary">
                  {jobs.total === 0
                    ? 'No matching listings'
                    : `${jobs.total} ${jobs.provenance.kind === 'sample' ? 'sample ' : ''}${
                        jobs.total === 1 ? 'listing' : 'listings'
                      }`}
                </p>
                <p className="mt-1 text-sm text-muted">{jobs.provenance.notice}</p>
              </div>
              <p className="text-sm font-semibold text-muted">
                {jobs.provenance.isStale
                  ? 'Last valid cached catalog shown'
                  : jobs.provenance.source}
              </p>
            </div>

            {jobs.items.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {jobs.items.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed text-center">
                <h2 className="text-xl">Try broader filters</h2>
                <p className="mt-3 text-muted">
                  No fictional sample matches this country, field and keyword combination.
                </p>
              </Card>
            )}

            {jobs.totalPages > 1 ? (
              <nav
                aria-label="Job results pagination"
                className="mt-8 flex flex-wrap items-center justify-center gap-4"
              >
                <Button
                  disabled={jobs.page <= 1}
                  onClick={() => changePage(jobs.page - 1)}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm font-bold text-primary">
                  Page {jobs.page} of {jobs.totalPages}
                </span>
                <Button
                  disabled={jobs.page >= jobs.totalPages}
                  onClick={() => changePage(jobs.page + 1)}
                  variant="outline"
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
