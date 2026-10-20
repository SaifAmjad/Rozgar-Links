import { ChevronDown } from 'lucide-react';

import { formatCount } from './format';

interface ChartTableProps {
  labelHeader: string;
  rows: readonly { count: number; label: string }[];
  valueHeader: string;
}

export function ChartTable({ labelHeader, rows, valueHeader }: ChartTableProps) {
  return (
    <details className="group mt-3 overflow-hidden rounded-lg border bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-primary">
        View exact values
        <ChevronDown
          aria-hidden="true"
          className="shrink-0 transition-transform group-open:rotate-180"
          size={18}
        />
      </summary>
      <div className="max-h-72 overflow-auto border-t bg-bg">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-surface text-primary">
            <tr>
              <th className="px-4 py-3 font-bold" scope="col">
                {labelHeader}
              </th>
              <th className="px-4 py-3 text-right font-bold" scope="col">
                {valueHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t" key={row.label}>
                <th className="px-4 py-3 font-medium text-text" scope="row">
                  {row.label}
                </th>
                <td className="px-4 py-3 text-right tabular-nums text-muted">
                  {formatCount(row.count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
