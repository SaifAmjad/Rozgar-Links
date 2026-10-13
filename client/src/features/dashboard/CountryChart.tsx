import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { StatsResponse } from '@rozgar-links/shared';

import { Card } from '../../components/ui/Card';
import { ChartTable } from './ChartTable';
import { formatCount } from './format';
import { ProvenanceLabel } from './ProvenanceLabel';

interface CountryChartProps {
  stats: StatsResponse;
}

export function CountryChart({ stats }: CountryChartProps) {
  const rows = stats.byCountry.map((entry) => ({ count: entry.count, label: entry.country }));

  return (
    <Card className="min-w-0 lg:col-span-2">
      <figure aria-labelledby="country-chart-title">
        <figcaption>
          <h3 className="text-xl" id="country-chart-title">
            Openings by country
          </h3>
          <div className="mt-2">
            <ProvenanceLabel isStale={stats.isStale} />
          </div>
        </figcaption>
        <div
          aria-label="Bar chart of indicative openings by Gulf country"
          className="mt-5 h-72 w-full"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={stats.byCountry} margin={{ bottom: 42, left: 8, right: 8, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                angle={-28}
                dataKey="country"
                height={70}
                interval={0}
                textAnchor="end"
                tick={{ fill: '#475569', fontSize: 11 }}
              />
              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} width={48} />
              <Tooltip formatter={(value) => formatCount(Number(value))} />
              <Legend />
              <Bar
                dataKey="count"
                fill="#0b3c73"
                name="Indicative openings"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartTable labelHeader="Country" rows={rows} valueHeader="Indicative openings" />
      </figure>
    </Card>
  );
}
