import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { StatsResponse } from '@rozgar-links/shared';

import { Button } from '../../components/ui/Button';
import { fetchStats } from './api';
import { formatCount } from './format';

function CountryFlag({ country }: { country: string }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-4 w-6 shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/10',
    'data-testid': `flag-${country.toLowerCase().replaceAll(' ', '-')}`,
    viewBox: '0 0 24 16',
  } as const;

  if (country === 'Saudi Arabia') {
    return (
      <svg {...commonProps}>
        <rect fill="#006C35" height="16" width="24" />
        <path d="M6 7.2h12M8 5.2h8M8 10.8h8.5" stroke="white" strokeWidth="1" />
      </svg>
    );
  }

  if (country === 'United Arab Emirates') {
    return (
      <svg {...commonProps}>
        <path d="M6 0h18v5.33H6z" fill="#00732F" />
        <path d="M6 5.33h18v5.34H6z" fill="white" />
        <path d="M6 10.67h18V16H6z" fill="#000" />
        <path d="M0 0h6v16H0z" fill="#F00" />
      </svg>
    );
  }

  if (country === 'Oman') {
    return (
      <svg {...commonProps}>
        <path d="M6 0h18v5.33H6z" fill="white" />
        <path d="M6 5.33h18v5.34H6z" fill="#DB161B" />
        <path d="M6 10.67h18V16H6z" fill="#008000" />
        <path d="M0 0h6v16H0z" fill="#DB161B" />
        <circle cx="3" cy="2.7" fill="white" r="1" />
      </svg>
    );
  }

  if (country === 'Qatar') {
    return (
      <svg {...commonProps}>
        <rect fill="#8A1538" height="16" width="24" />
        <path d="M0 0h7l3 1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1 3 1.1-3 1.1H0z" fill="white" />
      </svg>
    );
  }

  if (country === 'Kuwait') {
    return (
      <svg {...commonProps}>
        <path d="M0 0h24v5.33H0z" fill="#007A3D" />
        <path d="M0 5.33h24v5.34H0z" fill="white" />
        <path d="M0 10.67h24V16H0z" fill="#CE1126" />
        <path d="M0 0l6 5.33v5.34L0 16z" fill="#000" />
      </svg>
    );
  }

  if (country === 'Bahrain') {
    return (
      <svg {...commonProps}>
        <rect fill="#CE1126" height="16" width="24" />
        <path d="M0 0h7l3 1.6L7 3.2l3 1.6-3 1.6L10 8 7 9.6l3 1.6-3 1.6 3 1.6L7 16H0z" fill="white" />
      </svg>
    );
  }

  return null;
}

function hasIllustrativeIncrease(date: string, country: string, count: number) {
  const seed = `${date}:${country}:${count}`;
  return [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % 2 === 0;
}

export function HeroJobBar() {
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
      .then(setStats)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [requestVersion]);

  if (!stats && !error) {
    return (
      <div aria-label="Loading indicative job counts" className="mt-9 h-28 animate-pulse rounded-xl border border-white/20 bg-white/10 sm:h-20" role="status">
        <span className="sr-only">Loading indicative job counts</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-9 flex min-h-20 flex-col items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm sm:flex-row" role="alert">
        <p className="text-white/90">Indicative job counts are temporarily unavailable.</p>
        <Button className="shrink-0" onClick={retry} type="button" variant="outline">
          <RefreshCw aria-hidden="true" size={16} /> Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div aria-label="Indicative jobs by country" className="mt-9 overflow-hidden rounded-xl border border-white/20 bg-white text-text shadow-soft">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        <div className="col-span-2 flex items-center justify-between gap-3 bg-primary px-4 py-3 text-white sm:col-span-3 lg:col-span-1 lg:block">
          <p className="text-xs font-bold uppercase tracking-wider text-white/75">Total jobs</p>
          <p className="text-xl font-black text-white lg:mt-1">{formatCount(stats.totalOpenings)}</p>
        </div>
        {stats.byCountry.map(({ country, count }) => {
          const isIncrease = hasIllustrativeIncrease(stats.date, country, count);
          const TrendIcon = isIncrease ? TrendingUp : TrendingDown;

          return (
            <div className="border-t px-3 py-3 sm:px-4 lg:border-l lg:border-t-0" key={country}>
              <p
                className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted"
                title={country}
              >
                <CountryFlag country={country} />
                <span className="truncate">
                  {country === 'United Arab Emirates' ? 'UAE' : country}
                </span>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-primary">
                <span className="text-lg font-black">{formatCount(count)}</span>
                <span className="text-[11px] font-semibold text-muted">jobs</span>
                <TrendIcon
                  aria-label={`Illustrative ${isIncrease ? 'increase' : 'decrease'} indicator`}
                  className={isIncrease ? 'ml-0.5 text-brand-green' : 'ml-0.5 text-error'}
                  size={15}
                />
              </p>
            </div>
          );
        })}
      </div>
      <p className="sr-only">
        Indicative figures, updated daily. Direction arrows are illustrative, not verified trends.
      </p>
    </div>
  );
}
