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
      icon: Rows3,
      label: 'Total openings',
      value: formatCount(stats.totalOpenings),
    },
    {
      icon: Globe2,
      label: 'Countries covered',
      value: formatCount(stats.byCountry.filter((entry) => entry.count > 0).length),
    },
    {
      icon: PlusCircle,
      label: 'New today',
      value: formatCount(stats.newToday),
    },
    {
      icon: CalendarClock,
      label: 'Last updated',
      value: formatUpdatedAt(stats.lastUpdated),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Daily summary">
      {cards.map(({ icon: Icon, label, value }) => (
        <Card className="flex min-h-48 flex-col bg-bg" key={label}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/15 text-primary">
            <Icon aria-hidden="true" size={20} />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
          <div className="mt-auto pt-4">
            <ProvenanceLabel isStale={stats.isStale} />
          </div>
        </Card>
      ))}
    </div>
  );
}
