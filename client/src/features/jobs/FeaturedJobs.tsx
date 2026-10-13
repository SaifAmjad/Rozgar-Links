import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';

import type { JobsResponse } from '@rozgar-links/shared';

import { PageContainer } from '../../components/layout/PageContainer';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Skeleton } from '../../components/ui/Skeleton';
import { fetchJobs } from './api';
import { JobCard } from './JobCard';

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<JobsResponse>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetchJobs({ limit: 3, page: 1 }, controller.signal)
      .then(setJobs)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="py-14 sm:py-18" aria-labelledby="jobs-preview-title">
      <PageContainer>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-primary">
              <BriefcaseBusiness aria-hidden="true" className="text-brand-green" size={24} />
              <span className="text-sm font-bold uppercase tracking-[0.18em]">
                Fictional sample directory
              </span>
            </div>
            <h2 className="mt-4 text-3xl" id="jobs-preview-title">
              Featured sample listings
            </h2>
            <p className="mt-3 leading-7 text-muted">
              These examples demonstrate the directory only. They are not verified vacancies or
              employer endorsements.
            </p>
          </div>
          <ButtonLink to="/jobs" variant="outline">
            View all samples <ArrowRight aria-hidden="true" size={18} />
          </ButtonLink>
        </div>

        {failed ? (
          <p className="mt-8 rounded-xl border bg-surface p-5 text-muted" role="status">
            Featured samples are temporarily unavailable. The full directory can be retried from the
            jobs page.
          </p>
        ) : null}

        {!jobs && !failed ? (
          <div
            className="mt-8 grid gap-5 md:grid-cols-3"
            role="status"
            aria-label="Loading featured jobs"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-80" key={index} />
            ))}
          </div>
        ) : null}

        {jobs ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {jobs.items.map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
        ) : null}
      </PageContainer>
    </section>
  );
}
