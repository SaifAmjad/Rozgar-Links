import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import type { StatsResponse } from '@rozgar-links/shared';

import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { fetchStats } from './api';
import { ProvenanceLabel } from './ProvenanceLabel';
import { SummaryCards } from './SummaryCards';

const CountryChart = lazy(() =>
  import('./CountryChart').then((module) => ({ default: module.CountryChart })),
);
const FieldChart = lazy(() =>
  import('./FieldChart').then((module) => ({ default: module.FieldChart })),
);
const TrendChart = lazy(() =>
  import('./TrendChart').then((module) => ({ default: module.TrendChart })),
);

function DashboardSkeleton() {
  return (
    <div aria-label="Loading daily opportunity overview" role="status">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-48" key={index} />
        ))}
      </div>
      <ChartsSkeleton />
      <span className="sr-only">Loading indicative statistics</span>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-4">
      <Skeleton className="h-96 lg:col-span-2" />
      <Skeleton className="h-96 lg:col-span-2" />
      <Skeleton className="h-[40rem] lg:col-span-4" />
    </div>
  );
}

export function DashboardSection() {
  const [stats, setStats] = useState<StatsResponse>();
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setError(false);
    setStats(undefined);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchStats(controller.signal)
      .then((response) => setStats(response))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setStats(undefined);
        }
      });

    return () => controller.abort();
  }, [requestVersion]);

  return (
    <section className="bg-surface py-14 sm:py-18" aria-labelledby="dashboard-title">
      <PageContainer>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Badge>Indicative figures</Badge>
            <h2 className="mt-4 text-3xl" id="dashboard-title">
              Daily opportunity overview
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Deterministic estimates help illustrate opportunity patterns. They are not live or
              verified job openings.
            </p>
          </div>
          {stats ? <ProvenanceLabel isStale={stats.isStale} /> : null}
        </div>

        <div className="mt-8">
          {!stats && !error ? <DashboardSkeleton /> : null}

          {error ? (
            <Card className="text-center" role="alert">
              <h3 className="text-xl">Dashboard temporarily unavailable</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
                We could not load the indicative figures. No opening count has been invented or
                substituted.
              </p>
              <Button className="mt-5" onClick={retry} type="button" variant="outline">
                <RefreshCw aria-hidden="true" size={18} /> Retry
              </Button>
            </Card>
          ) : null}

          {stats ? (
            <div aria-live="polite">
              {stats.totalOpenings === 0 ? (
                <p className="mb-5 rounded-xl border bg-bg p-4 font-semibold text-muted">
                  No indicative openings are recorded for this update.
                </p>
              ) : null}
              <SummaryCards stats={stats} />
              <Suspense fallback={<ChartsSkeleton />}>
                <div className="mt-6 grid gap-6 lg:grid-cols-4">
                  <CountryChart stats={stats} />
                  <TrendChart stats={stats} />
                  <FieldChart stats={stats} />
                </div>
              </Suspense>
            </div>
          ) : null}
        </div>
      </PageContainer>
    </section>
  );
}
