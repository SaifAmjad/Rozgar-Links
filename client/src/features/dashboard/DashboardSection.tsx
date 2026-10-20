import { BarChart3, Globe2, Info, RefreshCw, TrendingUp } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';

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

type DashboardView = 'country' | 'field' | 'trend';

const dashboardViews = [
  { icon: Globe2, id: 'country' as const, label: 'Countries' },
  { icon: TrendingUp, id: 'trend' as const, label: '7-day trend' },
  { icon: BarChart3, id: 'field' as const, label: 'Job fields' },
];

function DashboardSkeleton() {
  return (
    <div aria-label="Loading daily opportunity overview" role="status">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <ChartSkeleton />
      <span className="sr-only">Loading indicative statistics</span>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="mt-4 h-80" />;
}

function ActiveChart({ stats, view }: { stats: StatsResponse; view: DashboardView }) {
  if (view === 'trend') return <TrendChart stats={stats} />;
  if (view === 'field') return <FieldChart stats={stats} />;
  return <CountryChart stats={stats} />;
}

export function DashboardSection() {
  const [stats, setStats] = useState<StatsResponse>();
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [activeView, setActiveView] = useState<DashboardView>('country');

  const retry = useCallback(() => {
    setError(false);
    setStats(undefined);
    setRequestVersion((version) => version + 1);
  }, []);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % dashboardViews.length;
    if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + dashboardViews.length) % dashboardViews.length;
    }
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = dashboardViews.length - 1;
    if (nextIndex === undefined) return;

    const nextView = dashboardViews[nextIndex];
    if (!nextView) return;

    event.preventDefault();
    setActiveView(nextView.id);
    const tabs =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  }

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
    <section className="border-y bg-surface py-10 sm:py-12" aria-labelledby="dashboard-title">
      <PageContainer>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge>
              <BarChart3 aria-hidden="true" className="mr-1.5" size={14} />
              Daily opportunity snapshot
            </Badge>
            <h2 className="mt-3 text-2xl sm:text-3xl" id="dashboard-title">
              Job market statistics
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">
              A simple overview of estimated opportunities by country, trend and job field.
            </p>
          </div>

          <div className="flex max-w-md items-start gap-2 rounded-xl border bg-bg px-4 py-3 text-sm text-muted">
            <Info aria-hidden="true" className="mt-0.5 shrink-0 text-brand-green" size={17} />
            <p>
              <strong className="text-primary">Indicative only.</strong> These estimates are not
              verified vacancies.
            </p>
          </div>
        </div>

        <div className="mt-6">
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
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <ProvenanceLabel isStale={stats.isStale} />
                <p className="text-xs text-muted">Updated from one validated daily snapshot.</p>
              </div>

              {stats.totalOpenings === 0 ? (
                <p className="mb-5 rounded-xl border bg-bg p-4 font-semibold text-muted">
                  No indicative openings are recorded for this update.
                </p>
              ) : null}

              <SummaryCards stats={stats} />

              <div className="mt-4 overflow-hidden rounded-xl border bg-bg shadow-soft">
                <div className="border-b bg-surface p-2.5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
                  <p className="px-1 text-sm font-bold text-primary">Explore the estimates</p>
                  <div
                    aria-label="Opportunity insight views"
                    className="mt-2 grid grid-cols-3 gap-1 rounded-lg border bg-bg p-1 sm:mt-0 sm:min-w-[22rem]"
                    role="tablist"
                  >
                    {dashboardViews.map(({ icon: Icon, id, label }, index) => (
                      <button
                        aria-controls={`dashboard-panel-${id}`}
                        aria-selected={activeView === id}
                        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors sm:text-sm ${
                          activeView === id
                            ? 'bg-primary text-white shadow-soft'
                            : 'text-muted hover:bg-surface hover:text-primary'
                        }`}
                        id={`dashboard-tab-${id}`}
                        key={id}
                        onClick={() => setActiveView(id)}
                        onKeyDown={(event) => handleTabKeyDown(event, index)}
                        role="tab"
                        tabIndex={activeView === id ? 0 : -1}
                        type="button"
                      >
                        <Icon aria-hidden="true" size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  aria-labelledby={`dashboard-tab-${activeView}`}
                  id={`dashboard-panel-${activeView}`}
                  role="tabpanel"
                >
                  <Suspense fallback={<ChartSkeleton />}>
                    <ActiveChart stats={stats} view={activeView} />
                  </Suspense>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PageContainer>
    </section>
  );
}
