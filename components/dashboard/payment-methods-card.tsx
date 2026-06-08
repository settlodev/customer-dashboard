import { CreditCard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PaymentMethodBreakdown } from "@/types/reports/payment-methods";

/**
 * Payment-method breakdown for the dashboard. Fed by the dedicated
 * `getPaymentMethodBreakdown` action (the transactions/by-payment-method
 * endpoint) rather than the overview-embedded array that came back empty.
 * Renders each method as a share bar sorted by amount.
 */

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

const COLORS = [
  "bg-primary",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-violet-500",
];

export function PaymentMethodsCard({
  data,
  loading,
}: {
  data: PaymentMethodBreakdown[] | null;
  loading?: boolean;
}) {
  const rows = [...(data ?? [])].sort((a, b) => b.totalAmount - a.totalAmount);
  const total = rows.reduce((s, r) => s + r.totalAmount, 0);
  const maxAmt = rows.reduce((m, r) => Math.max(m, r.totalAmount), 0) || 1;

  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            Payment methods
          </div>
          {total > 0 && (
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {fmt(total)} TZS
            </span>
          )}
        </div>

        {loading && !data ? (
          <div className="space-y-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center font-mono text-[12px] text-muted-foreground">
            No payments in this range
          </p>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((r, i) => {
              const pct =
                r.percentage != null && r.percentage > 0
                  ? r.percentage
                  : total > 0
                    ? (r.totalAmount / total) * 100
                    : 0;
              const barW = Math.round((r.totalAmount / maxAmt) * 100);
              const color = COLORS[i % COLORS.length];
              return (
                <li key={`${r.acceptedPaymentMethodType}-${i}`}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color)}
                      />
                      <span className="truncate text-sm font-medium text-ink">
                        {r.acceptedPaymentMethodTypeName || "Unknown"}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-ink">
                      {fmt(r.totalAmount)}{" "}
                      <span className="text-[10.5px] text-muted-foreground">
                        TZS
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", color)}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentMethodsCard;
