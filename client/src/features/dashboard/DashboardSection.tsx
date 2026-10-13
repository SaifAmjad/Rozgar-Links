import { BarChart3, Globe2, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-44" key={index} />
        ))}
      </div>
      <ChartSkeleton />
      <span className="sr-only">Loading indicative statistics</span>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="mt-6 h-[32rem]" />;
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
    <section
      className="relative overflow-hidden border-y bg-surface py-14 sm:py-18 lg:py-20"
      aria-labelledby="dashboard-title"
    >
      <div
        aria-hidden="true"
        className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-accent-blue/10"
      />
      <PageContainer className="relative">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="max-w-3xl">
            <Badge>
              <BarChart3 aria-hidden="true" className="mr-1.5" size={14} />
              Interactive opportunity insights
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl" id="dashboard-title">
              See indicative patterns at a glance
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Explore the same daily estimate by country, recent trend or career field. Switch views
              without losing context, and use the data tables for exact values.
            </p>
          </div>

          <div className="rounded-xl border bg-bg p-4 shadow-soft">
            <div className="flex gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brand-green"
                size={21}
              />
              <div>
                <p className="font-bold text-primary">Read these figures with context</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Estimates illustrate patterns only; they are not verified vacancies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9">
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ProvenanceLabel isStale={stats.isStale} />
                <p className="text-sm text-muted">One validated API response powers every view.</p>
              </div>

              {stats.totalOpenings === 0 ? (
                <p className="mb-5 rounded-xl border bg-bg p-4 font-semibold text-muted">
                  No indicative openings are recorded for this update.
                </p>
              ) : null}

              <SummaryCards stats={stats} />

              <div className="mt-6 overflow-hidden rounded-xl border bg-bg shadow-soft">
                <div className="border-b bg-surface p-3 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-green">
                      Explore the data
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Choose a view to compare the estimates.
                    </p>
                  </div>
                  <div
                    aria-label="Opportunity insight views"
                    className="mt-3 grid grid-cols-3 gap-1 rounded-xl border bg-bg p-1 sm:mt-0 sm:min-w-[24rem]"
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
