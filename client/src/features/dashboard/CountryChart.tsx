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
import { useLanguage } from '../../i18n/useLanguage';

interface CountryChartProps {
  stats: StatsResponse;
}

export function CountryChart({ stats }: CountryChartProps) {
  const { language, t } = useLanguage();
  const chartData = stats.byCountry.map((entry) => ({
    ...entry,
    displayCountry: t(entry.country),
  }));
  const rows = stats.byCountry.map((entry) => ({ count: entry.count, label: t(entry.country) }));

  return (
    <Card className="min-w-0 border-0 p-4 shadow-none sm:p-5">
      <figure aria-labelledby="country-chart-title">
        <figcaption>
          <h3 className="text-lg" id="country-chart-title">
            {t('Openings by country')}
          </h3>
          <div className="mt-2">
            <ProvenanceLabel isStale={stats.isStale} />
          </div>
        </figcaption>
        <div
          aria-label={t('Bar chart of indicative openings by Gulf country')}
          className="mt-3 hidden h-56 w-full sm:block lg:h-64"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData} margin={{ bottom: 34, left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                angle={-28}
                dataKey="displayCountry"
                height={58}
                interval={0}
                textAnchor="end"
                tick={{ fill: '#475569', fontSize: 11 }}
              />
              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} width={48} />
              <Tooltip formatter={(value) => formatCount(Number(value), language)} />
              <Legend />
              <Bar
                dataKey="count"
                fill="#0b3c73"
                name={t('Indicative openings')}
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
