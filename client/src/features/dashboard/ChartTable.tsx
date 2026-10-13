import { formatCount } from './format';

interface ChartTableProps {
  labelHeader: string;
  rows: readonly { count: number; label: string }[];
  valueHeader: string;
}

export function ChartTable({ labelHeader, rows, valueHeader }: ChartTableProps) {
  return (
    <div className="mt-5 max-h-64 overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface text-primary">
          <tr>
            <th className="px-3 py-2 font-bold" scope="col">
              {labelHeader}
            </th>
            <th className="px-3 py-2 text-right font-bold" scope="col">
              {valueHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t" key={row.label}>
              <th className="px-3 py-2 font-medium text-text" scope="row">
                {row.label}
              </th>
              <td className="px-3 py-2 text-right tabular-nums text-muted">
                {formatCount(row.count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
