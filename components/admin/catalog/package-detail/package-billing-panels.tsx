import type { ReactNode } from "react";
import {
  Coins,
  Gauge,
  History,
  Package as PackageIcon,
  Wallet,
} from "lucide-react";

import { formatDate, formatDateTime } from "@/components/admin/shared/format";
import { resolveActorName } from "@/lib/admin/actor-names";
import type {
  AddonResponse,
  BillingConfigResponse,
  PackageBreakdownResponse,
  PackageHistoryEntry,
  PackageResponse,
} from "@/types/admin/billing";

const ENTITY_LABEL: Record<string, string> = {
  LOCATION: "Per location",
  WAREHOUSE: "Per warehouse",
  STORE: "Per store",
};

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[12.5px] text-muted-foreground">
      {children}
    </p>
  );
}

function SectionCard({
  icon,
  tone,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <div
          className={`mt-0.5 grid h-7 w-7 place-items-center rounded-md ${tone}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {hint && (
            <p className="font-mono text-[11.5px] text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

// ── Pricing & billing ───────────────────────────────────────────────

export function PricingBillingPanel({
  pkg,
  breakdown,
  config,
}: {
  pkg: PackageResponse;
  breakdown: PackageBreakdownResponse | null;
  config: BillingConfigResponse | null;
}) {
  const annual = breakdown?.breakdowns?.find((b) => b.months === 12) ?? null;
  const currency = config?.defaultCurrency ?? "TZS";
  const billingUnit = ENTITY_LABEL[pkg.entityType] ?? pkg.entityType;

  const fields: { label: string; value: string }[] = [
    { label: "Billing unit", value: billingUnit },
    { label: "Currency", value: currency },
    {
      label: "Billing interval",
      value: pkg.billingInterval === "YEARLY" ? "Annual" : "Monthly",
    },
    {
      label: "Free trial",
      value: config?.trialDays != null ? `${config.trialDays} days` : "—",
    },
    {
      label: "Grace period",
      value:
        config?.gracePeriodDays != null
          ? `${config.gracePeriodDays} days past due`
          : "—",
    },
    {
      label: "Prepay discount",
      value:
        config?.annualDiscountPct != null
          ? `up to ${num(config.annualDiscountPct)}% (annual)`
          : "—",
    },
  ];

  return (
    <SectionCard
      icon={<Wallet className="h-4 w-4" />}
      tone="bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30"
      title="Pricing & billing"
      hint={`${billingUnit} · ${currency} · billed in advance`}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-canvas/40 p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Monthly
          </p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
            <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
              {currency}
            </span>
            {money(pkg.basePrice)}
            <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">
              /mo
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Annual
          </p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
            {annual ? (
              <>
                <span className="mr-1 text-[11px] font-semibold text-muted-foreground">
                  {currency}
                </span>
                {money(annual.totalPrice)}
                <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">
                  /yr
                </span>
              </>
            ) : (
              "—"
            )}
          </p>
          {annual && num(annual.savingsAmount) > 0 && (
            <p className="mt-1 font-mono text-[11px] text-pos">
              save {currency} {money(annual.savingsAmount)} ·{" "}
              {num(annual.discountPercentage)}%
            </p>
          )}
        </div>
        <div className="rounded-lg border border-line bg-canvas/40 p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Free trial
          </p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
            {config?.trialDays != null ? (
              <>
                {config.trialDays}
                <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">
                  days
                </span>
              </>
            ) : (
              "—"
            )}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            no card required
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {f.label}
            </dt>
            <dd className="mt-0.5 text-[13px] text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

// ── Available add-ons ───────────────────────────────────────────────

export function PackageAddonsPanel({
  addons,
  entityType,
}: {
  addons: AddonResponse[];
  entityType: string;
}) {
  const relevant = addons.filter(
    (a) => a.isActive !== false && (!a.entityType || a.entityType === entityType),
  );
  return (
    <SectionCard
      icon={<Coins className="h-4 w-4" />}
      tone="bg-amber-50 text-amber-500 dark:bg-amber-950/30"
      title="Available add-ons"
      hint="Optional · billed on top of base price"
    >
      {relevant.length === 0 ? (
        <EmptyRow>No add-ons available for this package type.</EmptyRow>
      ) : (
        <div className="flex flex-wrap gap-2">
          {relevant.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas/40 px-3 py-2"
            >
              <span className="text-[12.5px] font-semibold text-ink">
                {a.name}
              </span>
              <span className="font-mono text-[11.5px] font-semibold text-primary">
                +{money(a.price)}/mo
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Price position (ladder vs peer plans) ───────────────────────────

export function PricePositionPanel({
  packages,
  current,
}: {
  packages: PackageResponse[];
  current: PackageResponse;
}) {
  const peers = [...packages]
    .filter((p) => p.entityType === current.entityType && p.isActive !== false)
    .sort((a, b) => num(a.basePrice) - num(b.basePrice));
  const max = peers.reduce((m, p) => Math.max(m, num(p.basePrice)), 0) || 1;

  return (
    <SectionCard
      icon={<Gauge className="h-4 w-4" />}
      tone="bg-sky-50 text-sky-500 dark:bg-sky-950/30"
      title="Price position"
      hint={`Monthly · ${ENTITY_LABEL[current.entityType] ?? current.entityType}`}
    >
      {peers.length === 0 ? (
        <EmptyRow>No comparable packages.</EmptyRow>
      ) : (
        <ul className="space-y-2.5">
          {peers.map((p) => {
            const isCurrent = p.id === current.id;
            const pct = Math.max(4, (num(p.basePrice) / max) * 100);
            return (
              <li key={p.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-[12.5px] ${isCurrent ? "font-bold text-primary" : "font-medium text-ink-2"}`}
                  >
                    {p.name}
                  </span>
                  <span className="font-mono text-[11.5px] tabular-nums text-ink">
                    {money(p.basePrice)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full rounded-full ${isCurrent ? "bg-primary" : "bg-muted-2"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Metadata ────────────────────────────────────────────────────────

export function PackageMetadataPanel({
  pkg,
  history,
  actorNames,
}: {
  pkg: PackageResponse;
  history: PackageHistoryEntry[];
  actorNames: Record<string, string>;
}) {
  // Actor attribution is derived from the audit trail (the package entity
  // doesn't persist created/updated-by): the CREATE row is the creator, the
  // newest row (history is most-recent-first) is the last modifier.
  const createdEntry =
    history.find((h) => h.action === "CREATE") ??
    history[history.length - 1] ??
    null;
  const modifiedEntry = history[0] ?? null;
  const createdBy = createdEntry
    ? resolveActorName(createdEntry.userId, actorNames)
    : "—";
  const modifiedBy = modifiedEntry
    ? resolveActorName(modifiedEntry.userId, actorNames)
    : "—";

  const rows: { label: string; value: string }[] = [
    { label: "Identifier", value: pkg.code ?? pkg.id },
    { label: "Type", value: ENTITY_LABEL[pkg.entityType] ?? pkg.entityType },
    { label: "Visibility", value: pkg.isActive ? "Active" : "Deactivated" },
    { label: "Default plan", value: pkg.isDefault ? "Yes" : "No" },
    { label: "Version", value: `v${pkg.version ?? 1}` },
    { label: "Created", value: formatDate(pkg.createdAt) },
    { label: "Created by", value: createdBy },
    { label: "Last modified", value: formatDate(pkg.updatedAt) },
    { label: "Last modified by", value: modifiedBy },
  ];
  return (
    <SectionCard
      icon={<PackageIcon className="h-4 w-4" />}
      tone="bg-zinc-100 text-zinc-500 dark:bg-zinc-800/40"
      title="Metadata"
    >
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 py-2"
          >
            <dt className="text-[12.5px] text-muted-foreground">{r.label}</dt>
            <dd className="max-w-[60%] truncate font-mono text-[12px] tabular-nums text-ink">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

// ── Package history (audit timeline) ────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Created & published",
  UPDATE: "Configuration updated",
  DEACTIVATE: "Deactivated",
};
const ACTION_TONE: Record<string, string> = {
  CREATE: "bg-emerald-500",
  UPDATE: "bg-sky-500",
  DEACTIVATE: "bg-rose-500",
};

function humanizeField(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function summarizeChanges(changes: Record<string, unknown> | null): string[] {
  if (!changes) return [];
  const out: string[] = [];
  for (const [field, delta] of Object.entries(changes)) {
    // CREATE stores a full entity snapshot under "package" — don't dump it.
    if (field === "package") continue;
    if (
      delta &&
      typeof delta === "object" &&
      "from" in delta &&
      "to" in delta
    ) {
      const d = delta as { from: unknown; to: unknown };
      out.push(
        `${humanizeField(field)}: ${formatValue(d.from)} → ${formatValue(d.to)}`,
      );
    }
  }
  return out;
}

export function PackageHistoryPanel({
  history,
  actorNames,
}: {
  history: PackageHistoryEntry[];
  actorNames: Record<string, string>;
}) {
  return (
    <SectionCard
      icon={<History className="h-4 w-4" />}
      tone="bg-indigo-50 text-indigo-500 dark:bg-indigo-950/30"
      title="Package history"
      hint={`${history.length} change${history.length === 1 ? "" : "s"} · config & pricing`}
    >
      {history.length === 0 ? (
        <EmptyRow>No recorded changes yet.</EmptyRow>
      ) : (
        <ol>
          {history.map((h, i) => {
            const changes = summarizeChanges(h.changes);
            const isLast = i === history.length - 1;
            return (
              <li key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${ACTION_TONE[h.action] ?? "bg-muted-foreground"}`}
                  />
                  {!isLast && <span className="my-1 w-px flex-1 bg-line" />}
                </div>
                <div className={`min-w-0 ${isLast ? "" : "pb-4"}`}>
                  <p className="text-[13px] font-medium text-ink">
                    {ACTION_LABEL[h.action] ?? h.action}
                  </p>
                  {changes.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5">
                      {changes.map((c, j) => (
                        <li
                          key={j}
                          className="font-mono text-[11px] text-muted-foreground"
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(h.createdAt)} · by{" "}
                    {resolveActorName(h.userId, actorNames)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
