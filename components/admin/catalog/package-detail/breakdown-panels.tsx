import { Activity, Globe } from "lucide-react";

import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";
import {
  PackageStatusBreakdown,
  PackageWhitelabelBreakdownRow,
} from "@/types/admin/billing";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  TRIAL: "bg-sky-500",
  PAST_DUE: "bg-amber-500",
  EXPIRED: "bg-rose-500",
  SUSPENDED: "bg-violet-500",
  CANCELLED: "bg-zinc-500",
};

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

interface StatusBreakdownPanelProps {
  rows: PackageStatusBreakdown[];
  isLive: boolean;
}

export function StatusBreakdownPanel({
  rows,
  isLive,
}: StatusBreakdownPanelProps) {
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Subscribers by status
            </h2>
            <p className="font-mono text-[11.5px] text-muted-foreground">
              {total.toLocaleString()} total · snapshot
            </p>
          </div>
        </div>
        {!isLive && <StubBadge />}
      </header>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          No subscribers in any status.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => {
            const pct = total > 0 ? (row.count / total) * 100 : 0;
            return (
              <li key={row.status} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-ink">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${STATUS_TONE[row.status] ?? "bg-muted-foreground"}`}
                    />
                    <span className="font-medium">
                      {row.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {row.count.toLocaleString()}
                    <span className="ml-2 text-[10.5px]">
                      {pct.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full ${STATUS_TONE[row.status] ?? "bg-muted-foreground"}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface WhitelabelBreakdownPanelProps {
  rows: PackageWhitelabelBreakdownRow[];
  isLive: boolean;
}

export function WhitelabelBreakdownPanel({
  rows,
  isLive,
}: WhitelabelBreakdownPanelProps) {
  const totalSubs = rows.reduce((s, r) => s + r.subscribers, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);

  // Sort newest first by subscribers — admins scan top-down looking
  // for the largest segments.
  const sorted = [...rows].sort((a, b) => b.subscribers - a.subscribers);
  const top = sorted[0]?.subscribers ?? 1;

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-sky-50 text-sky-500 dark:bg-sky-950/30">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Subscribers by whitelabel
            </h2>
            <p className="font-mono text-[11.5px] text-muted-foreground">
              {totalSubs.toLocaleString()} subs · {formatMoney(totalRev)} revenue
            </p>
          </div>
        </div>
        {!isLive && <StubBadge />}
      </header>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          No whitelabels have subscribers on this package.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((row) => {
            const pct = top > 0 ? (row.subscribers / top) * 100 : 0;
            const share = totalSubs > 0 ? (row.subscribers / totalSubs) * 100 : 0;
            return (
              <li key={row.whitelabelId} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="truncate font-medium text-ink">
                    {row.whitelabelName}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {row.subscribers.toLocaleString()} subs
                    <span className="ml-2 text-[10.5px]">
                      {share.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${Math.max(3, pct)}%` }}
                  />
                </div>
                <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  {formatMoney(row.revenue)} revenue
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
