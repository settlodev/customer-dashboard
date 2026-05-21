import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BusinessLocationBreakdownRow } from "@/types/admin/business-intel";

interface BusinessLocationPerformanceProps {
  rows: BusinessLocationBreakdownRow[];
  currency: string;
  error: string | null;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toLocaleString();
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

export function BusinessLocationPerformance({
  rows,
  currency,
  error,
}: BusinessLocationPerformanceProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          Per-location performance · 30 days
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          Sorted by net sales · {currency}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-4 text-center text-sm text-muted-foreground">
          No order activity in the last 30 days.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Net sales</TableHead>
                <TableHead className="text-right">Gross profit</TableHead>
                <TableHead className="text-right">AOV</TableHead>
                <TableHead className="text-right">Staff</TableHead>
                <TableHead className="text-right">Customers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.location_id}>
                  <TableCell>
                    <span className="font-medium text-ink">
                      {r.location_name ?? r.location_id}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.total_orders)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(r.completed_orders)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMoney(r.net_sales)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-pos">
                    {formatMoney(r.gross_profit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(r.avg_order_value)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(r.active_staff)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(r.unique_customers)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
