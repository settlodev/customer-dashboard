"use client";

import { useState } from "react";
import {
  Building2,
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { DepartmentProductSalesTable } from "@/components/reports/sales/department-product-sales-table";
import { DepartmentSalesExportButton } from "@/components/reports/sales/department-sales-export-button";
import { type DepartmentProductSale } from "@/components/tables/reports/department-product-sales/columns";
import type { Department } from "@/types/department/type";

export type { DepartmentProductSale };

const TABS = [
  { key: "overview", label: "Overview", icon: Building2 },
  { key: "sales", label: "Sales", icon: ShoppingCart },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Props {
  department: Department;
  productSales: DepartmentProductSale[];
  currency: string;
  /** Current `from`/`to` URL params (yyyy-MM-dd) driving the Sales period. */
  from: string;
  to: string;
  initialTab?: string;
}

export function DepartmentDetailView({
  department,
  productSales,
  currency,
  from,
  to,
  initialTab,
}: Props) {
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab)
      ? (initialTab as TabKey)
      : "overview",
  );

  const soldCount = productSales.filter(
    (p) => p.quantitySold > 0 || p.grossSales > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            const badge =
              t.key === "sales" && soldCount > 0 ? String(soldCount) : null;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
                {badge && (
                  <span
                    className={`rounded-[3px] px-1.5 font-mono text-[9.5px] tracking-[0.02em] ${
                      isActive
                        ? "border border-line bg-card text-ink-3"
                        : "bg-canvas text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <OverviewTab department={department} />}
      {tab === "sales" && (
        <DepartmentSalesTab
          productSales={productSales}
          currency={currency}
          departmentName={department.name}
          from={from}
          to={to}
        />
      )}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────

function OverviewTab({ department }: { department: Department }) {
  const statusLabel = department.active ? "Active" : "Inactive";

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Department information
        </h3>

        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
            <DetailRow label="Name" value={department.name} />
            <DetailRow
              label="Identifier"
              value={
                department.identifier ? (
                  <span className="font-mono text-[12px]">
                    {department.identifier}
                  </span>
                ) : null
              }
            />
            <DetailRow label="Status" value={statusLabel} />
            <DetailRow
              label="Default"
              value={department.isDefault ? "Yes" : "No"}
            />
            <DetailRow
              label="Color"
              value={
                department.color ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded border border-line"
                      style={{ backgroundColor: department.color }}
                    />
                    <span className="font-mono text-[12px]">
                      {department.color}
                    </span>
                  </span>
                ) : null
              }
            />
            <DetailRow
              label="Display order"
              value={department.order != null ? String(department.order) : null}
            />
            <DetailRow
              label="Default POS view"
              value={department.defaultPosView}
            />
            <DetailRow
              label="Created"
              value={new Date(department.createdAt).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" },
              )}
            />
            <DetailRow
              label="Updated"
              value={new Date(department.updatedAt).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" },
              )}
            />
          </dl>
        </div>

        {department.description && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink-2">
              {department.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sales (products in this department, selected period) ─────────────

function DepartmentSalesTab({
  productSales,
  currency,
  departmentName,
  from,
  to,
}: {
  productSales: DepartmentProductSale[];
  currency: string;
  departmentName: string;
  from: string;
  to: string;
}) {
  const withSales = productSales.filter(
    (p) => p.quantitySold > 0 || p.grossSales > 0,
  );

  const fmt = (v: number) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const totalQty = withSales.reduce((s, p) => s + p.quantitySold, 0);
  const totalGross = withSales.reduce((s, p) => s + p.grossSales, 0);
  const totalNet = withSales.reduce((s, p) => s + p.netSales, 0);
  const totalProfit = withSales.reduce((s, p) => s + p.grossProfit, 0);
  const margin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Period filter + export — the date range drives a server refetch;
          search / sort / paging happen in the table itself. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrdersDateFilter from={from} to={to} />
        <DepartmentSalesExportButton
          rows={withSales}
          departmentName={departmentName}
          currency={currency}
          from={from}
          to={to}
        />
      </div>

      {withSales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No sales recorded for products in this department in the selected
              period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiStrip cols={6}>
            <KpiCard
              icon={<Package className="h-3 w-3" />}
              label="Products sold"
              value={withSales.length.toLocaleString()}
            />
            <KpiCard
              icon={<ShoppingCart className="h-3 w-3" />}
              label="Qty sold"
              value={totalQty.toLocaleString()}
            />
            <KpiCard
              icon={<DollarSign className="h-3 w-3" />}
              label="Gross"
              value={fmt(totalGross)}
              unit={currency}
            />
            <KpiCard
              icon={<DollarSign className="h-3 w-3" />}
              label="Net"
              value={fmt(totalNet)}
              unit={currency}
            />
            <KpiCard
              icon={<TrendingUp className="h-3 w-3" />}
              label="Gross profit"
              value={fmt(totalProfit)}
              unit={currency}
              deltaTone={totalProfit >= 0 ? "pos" : "neg"}
            />
            <KpiCard
              icon={<Percent className="h-3 w-3" />}
              label="Margin"
              value={`${margin.toFixed(1)}%`}
              deltaTone={margin >= 20 ? "pos" : margin >= 10 ? "neutral" : "neg"}
            />
          </KpiStrip>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Products sold in this department
            </h3>
            <DepartmentProductSalesTable data={withSales} currency={currency} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
