import { CalendarClock, Globe2, PlusCircle, Rows3 } from 'lucide-react';

import type { StatsResponse } from '@rozgar-links/shared';

import { formatCount, formatUpdatedAt } from './format';

interface SummaryCardsProps {
  stats: StatsResponse;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      icon: Rows3,
      iconClasses: 'bg-accent-blue/15 text-primary',
      label: 'Total openings',
      value: formatCount(stats.totalOpenings),
      valueClasses: 'text-2xl sm:text-3xl',
    },
    {
      icon: Globe2,
      iconClasses: 'bg-light-green/15 text-brand-green',
      label: 'Countries covered',
      value: formatCount(stats.byCountry.filter((entry) => entry.count > 0).length),
      valueClasses: 'text-2xl sm:text-3xl',
    },
    {
      icon: PlusCircle,
      iconClasses: 'bg-accent-blue/15 text-brand-blue',
      label: 'New today',
      value: formatCount(stats.newToday),
      valueClasses: 'text-2xl sm:text-3xl',
    },
    {
      icon: CalendarClock,
      iconClasses: 'bg-primary/10 text-primary',
      label: 'Last updated',
      value: formatUpdatedAt(stats.lastUpdated),
      valueClasses: 'text-sm leading-5 sm:text-base',
    },
  ];

  return (
    <div
      className="grid grid-cols-2 overflow-hidden rounded-xl border bg-bg shadow-soft lg:grid-cols-4"
      aria-label="Daily summary"
    >
      {cards.map(({ icon: Icon, iconClasses, label, value, valueClasses }, index) => (
        <div
          className={`flex min-h-28 items-center gap-3 p-4 sm:p-5 ${
            index % 2 === 0 ? 'border-r' : ''
          } ${index < 2 ? 'border-b lg:border-b-0' : ''} ${index > 0 ? 'lg:border-l' : ''} lg:border-r-0`}
          key={label}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:inline-flex ${iconClasses}`}
            >
              <Icon aria-hidden="true" size={18} />
            </span>
            <div className="min-w-0">
              <p className={`break-words font-black text-primary ${valueClasses}`}>{value}</p>
              <p className="mt-1 text-xs font-semibold text-muted sm:text-sm">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
