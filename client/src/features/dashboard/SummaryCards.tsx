import { CalendarClock, Globe2, PlusCircle, Rows3 } from 'lucide-react';

import type { StatsResponse } from '@rozgar-links/shared';

import { Card } from '../../components/ui/Card';
import { formatCount, formatUpdatedAt } from './format';
import { ProvenanceLabel } from './ProvenanceLabel';

interface SummaryCardsProps {
  stats: StatsResponse;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      accent: 'bg-brand-blue',
      icon: Rows3,
      iconClasses: 'bg-accent-blue/15 text-primary',
      label: 'Total openings',
      value: formatCount(stats.totalOpenings),
      valueClasses: 'text-3xl',
    },
    {
      accent: 'bg-brand-green',
      icon: Globe2,
      iconClasses: 'bg-light-green/15 text-brand-green',
      label: 'Countries covered',
      value: formatCount(stats.byCountry.filter((entry) => entry.count > 0).length),
      valueClasses: 'text-3xl',
    },
    {
      accent: 'bg-accent-blue',
      icon: PlusCircle,
      iconClasses: 'bg-accent-blue/15 text-brand-blue',
      label: 'New today',
      value: formatCount(stats.newToday),
      valueClasses: 'text-3xl',
    },
    {
      accent: 'bg-primary',
      icon: CalendarClock,
      iconClasses: 'bg-primary/10 text-primary',
      label: 'Last updated',
      value: formatUpdatedAt(stats.lastUpdated),
      valueClasses: 'text-lg leading-7',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Daily summary">
      {cards.map(({ accent, icon: Icon, iconClasses, label, value, valueClasses }) => (
        <Card className="relative flex min-h-44 flex-col overflow-hidden bg-bg" key={label}>
          <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconClasses}`}
            >
              <Icon aria-hidden="true" size={20} />
            </span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wider text-muted">
              Indicative
            </span>
          </div>
          <p className={`mt-5 font-black text-primary ${valueClasses}`}>{value}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
          <div className="mt-auto pt-4">
            <ProvenanceLabel className="text-xs" isStale={stats.isStale} />
          </div>
        </Card>
      ))}
    </div>
  );
}
