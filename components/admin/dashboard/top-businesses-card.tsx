import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { Monogram } from "@/components/admin/shared/monogram";
import { PlanBadge } from "@/components/admin/shared/plan-badge";
import { TopBusinessRow } from "@/types/admin/dashboard";

/**
 * Top businesses by GMV — a compact static league table for the dashboard.
 * (The accounts/businesses list pages use the interactive DataTable; this is
 * a read-only summary so a plain table keeps it light.)
 */

export function TopBusinessesCard({
  rows,
  href = "/businesses",
  stub,
}: {
  rows: TopBusinessRow[];
  href?: string;
  stub?: boolean;
}) {
  return (
    <SectionCard
      title="Top businesses"
      subtitle="By GMV processed · last 30 days"
      linkLabel="All businesses"
      linkHref={href}
      stub={stub}
      flush
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="[&>th]:border-b [&>th]:border-line [&>th]:px-4 [&>th]:pb-2.5 [&>th]:font-mono [&>th]:text-[10.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.07em] [&>th]:text-muted-foreground">
              <th className="text-left">Business</th>
              <th className="text-left">Region</th>
              <th className="text-left">Plan</th>
              <th className="text-right">GMV 30d</th>
              <th className="text-right">MRR</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors last:[&>td]:border-b-0 hover:bg-primary/[0.06] [&>td]:border-b [&>td]:border-line [&>td]:px-4 [&>td]:py-3 [&>td]:align-middle"
              >
                <td>
                  <div className="flex items-center gap-3">
                    <Monogram name={row.name} color={row.avatarColor} size="md" />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
                        {row.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {row.locations}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-[12px] text-ink-3">{row.region}</td>
                <td>
                  <PlanBadge tier={row.tier} label={row.planLabel} />
                </td>
                <td className="text-right font-mono text-[12.5px] font-medium tabular-nums text-ink">
                  {row.gmvLabel}
                </td>
                <td className="text-right font-mono text-[12.5px] font-medium tabular-nums text-ink">
                  {row.mrrLabel}
                </td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        row.statusTone === "pos" ? "bg-pos" : "bg-warn",
                      )}
                    />
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
