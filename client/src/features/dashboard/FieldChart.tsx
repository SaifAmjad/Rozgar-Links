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

interface FieldChartProps {
  stats: StatsResponse;
}

export function FieldChart({ stats }: FieldChartProps) {
  const chartData = [...stats.byField].sort((left, right) => left.count - right.count);
  const rows = [...stats.byField]
    .sort((left, right) => right.count - left.count)
    .map((entry) => ({ count: entry.count, label: entry.field }));

  return (
    <Card className="min-w-0 border-0 shadow-none">
      <figure aria-labelledby="field-chart-title">
        <figcaption>
          <h3 className="text-xl" id="field-chart-title">
            Openings by job field
          </h3>
          <div className="mt-2">
            <ProvenanceLabel isStale={stats.isStale} />
          </div>
        </figcaption>
        <div
          aria-label="Bar chart of indicative openings by job field"
          className="mt-5 hidden h-[34rem] w-full md:block"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 24, top: 8 }}>
              <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} type="number" />
              <YAxis
                dataKey="field"
                tick={{ fill: '#475569', fontSize: 11 }}
                type="category"
                width={118}
              />
              <Tooltip formatter={(value) => formatCount(Number(value))} />
              <Legend />
              <Bar
                dataKey="count"
                fill="#2e8b57"
                name="Indicative openings"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartTable labelHeader="Job field" rows={rows} valueHeader="Indicative openings" />
      </figure>
    </Card>
  );
}
