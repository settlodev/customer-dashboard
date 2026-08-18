import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

import { formatDate } from "@/components/admin/shared/format";
import type { PackageSubscriberRow } from "@/types/admin/billing";

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  ACTIVE: { dot: "bg-emerald-500", label: "Active" },
  PAST_DUE: { dot: "bg-amber-500", label: "Past due" },
  TRIAL: { dot: "bg-sky-500", label: "Trial" },
  INACTIVE: { dot: "bg-zinc-400", label: "Inactive" },
};

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`pb-2.5 pr-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}

export function PackageSubscribersTable({
  subscribers,
}: {
  subscribers: PackageSubscriberRow[];
}) {
  const totalMrr = subscribers.reduce((s, r) => s + (Number(r.mrr) || 0), 0);

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-500 dark:bg-blue-950/30">
          <Building2 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Subscribers on this plan
          </h2>
          <p className="font-mono text-[11.5px] text-muted-foreground">
            {subscribers.length} business{subscribers.length === 1 ? "" : "es"} ·
            TZS {money(totalMrr)}/mo
          </p>
        </div>
      </header>

      {subscribers.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-muted-foreground">
          No active subscribers on this package yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line text-left">
                <Th>Business</Th>
                <Th>Region</Th>
                <Th>Whitelabel</Th>
                <Th className="text-right">MRR</Th>
                <Th>Since</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => {
                const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.INACTIVE;
                return (
                  <tr
                    key={s.businessId}
                    className="border-b border-line/60 last:border-0 hover:bg-canvas/40"
                  >
                    <td className="py-2.5 pr-3">
                      <p className="text-[13px] font-medium text-ink">
                        {s.businessName}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {s.locations} location{s.locations === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-[12.5px] text-ink-2">
                      {s.region || "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11.5px] text-muted-foreground">
                      {s.whitelabel}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-[12.5px] tabular-nums text-ink">
                      {money(s.mrr)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11.5px] tabular-nums text-muted-foreground">
                      {formatDate(s.since)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${st.dot}`}
                        />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
