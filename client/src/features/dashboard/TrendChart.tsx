import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { StatsResponse } from '@rozgar-links/shared';

import { Card } from '../../components/ui/Card';
import { ChartTable } from './ChartTable';
import { formatCount, formatDate } from './format';
import { ProvenanceLabel } from './ProvenanceLabel';

interface TrendChartProps {
  stats: StatsResponse;
}

export function TrendChart({ stats }: TrendChartProps) {
  const chartData = stats.last7Days.map((entry) => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));
  const rows = stats.last7Days.map((entry) => ({
    count: entry.totalOpenings,
    label: formatDate(entry.date),
  }));

  return (
    <Card className="min-w-0 border-0 p-4 shadow-none sm:p-5">
      <figure aria-labelledby="trend-chart-title">
        <figcaption>
          <h3 className="text-lg" id="trend-chart-title">
            Seven-day trend
          </h3>
          <div className="mt-2">
            <ProvenanceLabel isStale={stats.isStale} />
          </div>
        </figcaption>
        <div
          aria-label="Line chart of indicative openings over seven days"
          className="mt-3 hidden h-56 w-full sm:block lg:h-64"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData} margin={{ bottom: 16, left: 8, right: 20, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="displayDate" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis
                allowDecimals={false}
                domain={['dataMin - 100', 'dataMax + 100']}
                tick={{ fill: '#475569', fontSize: 12 }}
                width={48}
              />
              <Tooltip formatter={(value) => formatCount(Number(value))} />
              <Legend />
              <Line
                dataKey="totalOpenings"
                dot={{ fill: '#1565a8', r: 4 }}
                name="Indicative openings"
                stroke="#1565a8"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartTable labelHeader="Date" rows={rows} valueHeader="Indicative openings" />
      </figure>
    </Card>
  );
}
