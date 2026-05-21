import {
  AlertTriangle,
  Banknote,
  Boxes,
  CalendarClock,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  AdminBusinessFinancialsSummary,
  AdminBusinessInventorySummary,
} from "@/types/admin/business-operations";

interface BusinessOperationsPanelProps {
  inventory: AdminBusinessInventorySummary | null;
  financials: AdminBusinessFinancialsSummary | null;
  currency: string;
  errors: {
    inventory: string | null;
    financials: string | null;
  };
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(Number(value)).toLocaleString();
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toLocaleString();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return "Never";
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days < 1) return "Today";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function inventoryAgeDays(receivedDate: string | null): number | null {
  if (!receivedDate) return null;
  try {
    const ms = Date.now() - new Date(receivedDate).getTime();
    return Math.floor(ms / 86_400_000);
  } catch {
    return null;
  }
}

export function BusinessOperationsPanel({
  inventory,
  financials,
  currency,
  errors,
}: BusinessOperationsPanelProps) {
  const oldestAgeDays = inventoryAgeDays(
    inventory?.oldestActiveReceivedDate ?? null,
  );

  const cashFlowTone =
    financials && financials.netCashFlowPeriod > 0
      ? "pos"
      : financials && financials.netCashFlowPeriod < 0
        ? "neg"
        : "neutral";

  const apTone =
    financials && financials.apDays90Plus > 0
      ? "neg"
      : financials && financials.apDays60 > 0
        ? "neutral"
        : "pos";

  return (
    <div className="space-y-4">
      {/* Inventory */}
      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Warehouse className="h-4 w-4 text-primary" />
          Inventory on hand
        </h3>

        {errors.inventory && !inventory ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.inventory}
          </p>
        ) : !inventory ? (
          <p className="text-sm text-muted-foreground">
            Inventory summary unavailable.
          </p>
        ) : (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Boxes className="h-3.5 w-3.5" />}
                label="Total stock value"
                value={formatMoney(inventory.totalStockValue)}
                unit={currency}
                delta={`${formatNumber(inventory.totalQuantityOnHand)} units`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Package className="h-3.5 w-3.5" />}
                label="Active batches"
                value={formatNumber(inventory.activeBatchCount)}
                delta={`${formatNumber(inventory.activeLocationCount)} locations`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Last stock-in"
                value={formatRelative(inventory.lastReceivedDate)}
                delta={
                  inventory.lastReceivedDate
                    ? formatDate(inventory.lastReceivedDate)
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={
                  (inventory.recalledBatchCount ?? 0) > 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Boxes className="h-3.5 w-3.5" />
                  )
                }
                label="Recalled batches"
                value={formatNumber(inventory.recalledBatchCount)}
                deltaTone={
                  (inventory.recalledBatchCount ?? 0) > 0 ? "neg" : "pos"
                }
                delta={
                  (inventory.recalledBatchCount ?? 0) > 0
                    ? "supply-chain stress"
                    : "none"
                }
              />
            </KpiStrip>

            {oldestAgeDays !== null && (
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                Oldest active batch received{" "}
                <span className="text-ink">{oldestAgeDays} days ago</span>
                {oldestAgeDays > 365
                  ? " — aged stock; investigate movement"
                  : ""}
              </p>
            )}
          </>
        )}
      </div>

      {/* Financials */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Banknote className="h-4 w-4 text-primary" />
            Financials &amp; payables
          </h3>
          {financials && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {financials.periodStart} → {financials.periodEnd}
            </p>
          )}
        </div>

        {errors.financials && !financials ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.financials}
          </p>
        ) : !financials ? (
          <p className="text-sm text-muted-foreground">
            Financials summary unavailable.
          </p>
        ) : (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Revenue (period)"
                value={formatMoney(financials.revenuePeriod)}
                unit={currency}
                delta={`${formatNumber(financials.postedJournalEntriesPeriod)} journal entries`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<TrendingDown className="h-3.5 w-3.5" />}
                label="Expenses paid"
                value={formatMoney(financials.expensesPaidPeriod)}
                unit={currency}
                delta={`${formatNumber(financials.postedExpensesPeriod)} expenses`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={
                  cashFlowTone === "pos" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )
                }
                label="Net cash flow"
                value={formatMoney(financials.netCashFlowPeriod)}
                unit={currency}
                deltaTone={cashFlowTone}
                delta={
                  cashFlowTone === "pos"
                    ? "positive"
                    : cashFlowTone === "neg"
                      ? "negative"
                      : "neutral"
                }
              />
              <KpiCard
                icon={<Receipt className="h-3.5 w-3.5" />}
                label="A/P outstanding"
                value={formatMoney(financials.apOutstanding)}
                unit={currency}
                deltaTone={apTone}
                delta={
                  financials.apDays90Plus > 0
                    ? "90+ days overdue"
                    : financials.apDays60 > 0
                      ? "60+ days overdue"
                      : "current"
                }
              />
            </KpiStrip>

            {/* A/P aging breakdown */}
            {financials.apOutstanding > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  A/P aging
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <ApAgingBucket
                    label="Current"
                    value={financials.apCurrent}
                    currency={currency}
                    tone="pos"
                  />
                  <ApAgingBucket
                    label="1–30 d"
                    value={financials.apDays30}
                    currency={currency}
                    tone="neutral"
                  />
                  <ApAgingBucket
                    label="31–60 d"
                    value={financials.apDays60}
                    currency={currency}
                    tone="warn"
                  />
                  <ApAgingBucket
                    label="61–90 d"
                    value={financials.apDays90}
                    currency={currency}
                    tone="warn"
                  />
                  <ApAgingBucket
                    label="90+ d"
                    value={financials.apDays90Plus}
                    currency={currency}
                    tone="neg"
                  />
                </div>
              </div>
            )}

            {/* Activity */}
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2">
              <ActivityRow
                label="Last journal entry"
                value={formatRelative(financials.lastJournalEntryAt)}
                hint={
                  financials.lastJournalEntryAt
                    ? formatDate(financials.lastJournalEntryAt)
                    : undefined
                }
              />
              <ActivityRow
                label="Last expense"
                value={formatRelative(financials.lastExpenseAt)}
                hint={
                  financials.lastExpenseAt
                    ? formatDate(financials.lastExpenseAt)
                    : undefined
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ApAgingBucket({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone: "pos" | "neutral" | "warn" | "neg";
}) {
  const toneClass =
    tone === "pos"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
        : tone === "neg"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
          : "border-muted bg-muted text-muted-foreground";
  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums">
        {value > 0 ? formatMoney(value) : "0"} {currency}
      </p>
    </div>
  );
}

function ActivityRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line/60 bg-canvas/40 px-3 py-2">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] text-ink">{value}</p>
      {hint && (
        <p className="font-mono text-[10.5px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
