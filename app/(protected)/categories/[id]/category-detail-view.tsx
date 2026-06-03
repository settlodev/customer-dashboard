"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/types/category/type";

/** Per-product sales for one category, last 30 days. */
export interface CategoryProductSale {
  productId: string;
  name: string;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalCost: number;
  grossProfit: number;
  totalDiscount: number;
}

const TABS = [
  { key: "overview", label: "Overview", icon: Tag },
  { key: "sales", label: "Sales", icon: ShoppingCart },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Props {
  category: Category;
  productSales: CategoryProductSale[];
  currency: string;
  initialTab?: string;
}

export function CategoryDetailView({
  category,
  productSales,
  currency,
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

      {tab === "overview" && <OverviewTab category={category} />}
      {tab === "sales" && (
        <CategorySalesTab productSales={productSales} currency={currency} />
      )}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────

function OverviewTab({ category }: { category: Category }) {
  const statusLabel =
    category.archivedAt != null
      ? "Archived"
      : category.active
        ? "Active"
        : "Inactive";

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Category information
        </h3>

        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
            <DetailRow label="Name" value={category.name} />
            <DetailRow
              label="Slug"
              value={
                category.slug ? (
                  <span className="font-mono text-[12px]">{category.slug}</span>
                ) : null
              }
            />
            <DetailRow label="Department" value={category.departmentName} />
            <DetailRow label="Parent" value={category.parentName} />
            <DetailRow
              label="Products"
              value={
                category.productCount != null
                  ? category.productCount.toLocaleString()
                  : null
              }
            />
            <DetailRow
              label="Sort order"
              value={category.sortOrder?.toString()}
            />
            <DetailRow label="Status" value={statusLabel} />
            <DetailRow
              label="Created"
              value={new Date(category.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            <DetailRow
              label="Updated"
              value={new Date(category.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          </dl>
        </div>

        {category.description && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink-2">
              {category.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sales (products in this category, last 30 days) ─────────────────

function CategorySalesTab({
  productSales,
  currency,
}: {
  productSales: CategoryProductSale[];
  currency: string;
}) {
  const withSales = productSales.filter(
    (p) => p.quantitySold > 0 || p.grossSales > 0,
  );

  if (withSales.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sales recorded for products in this category in the last 30 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const totalQty = withSales.reduce((s, p) => s + p.quantitySold, 0);
  const totalGross = withSales.reduce((s, p) => s + p.grossSales, 0);
  const totalNet = withSales.reduce((s, p) => s + p.netSales, 0);
  const totalProfit = withSales.reduce((s, p) => s + p.grossProfit, 0);
  const margin = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

  return (
    <div className="space-y-6">
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

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-semibold">
            Products in this category (last 30 days)
          </h3>
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty sold</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withSales.map((p) => {
                  const m =
                    p.netSales > 0 ? (p.grossProfit / p.netSales) * 100 : 0;
                  return (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/products/${p.productId}?tab=sales`}
                          className="text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.quantitySold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(p.grossSales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.totalDiscount > 0 ? fmt(p.totalDiscount) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(p.netSales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmt(p.totalCost)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          p.grossProfit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {fmt(p.grossProfit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={
                            m >= 20
                              ? "text-green-600 dark:text-green-400"
                              : m >= 10
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {m.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
