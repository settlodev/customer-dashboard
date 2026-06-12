"use client";

import type { ReactNode } from "react";

import {
  Banknote,
  Ban,
  CircleDollarSign,
  Clock,
  Coins,
  Receipt,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { OrdersTabNav } from "@/components/orders/orders-tab-nav";
import { OrdersDataTable } from "@/components/tables/orders/orders-data-table";
import { AbandonedDataTable } from "@/components/tables/orders/abandoned-data-table";
import { Order, OrderStatus, PaymentStatus } from "@/types/orders/type";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

export type SalesView = "orders" | "abandoned";

interface Props {
  /** `/tables/{id}` or `/staff/{id}` — the route the sub-tab links and
   * filters live on. */
  basePath: string;
  /** Active sub-tab, sourced from the `?view=` param. */
  view: SalesView;
  /** Current `from`/`to` (yyyy-MM-dd) for the date filter. */
  from: string;
  to: string;
  /**
   * The full scoped set for the active sub-tab BEFORE search and
   * pagination — KPIs derive from this so the totals don't jump when the
   * user types in the search box.
   */
  scoped: Order[];
  /** The current page's rows (already sliced server-side). */
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  currency: string;
  /** Carried across sub-tab switches so date / search context survives. */
  preservedParams: Record<string, string | undefined>;
  /**
   * Query param that carries the active sub-tab. Defaults to `view` (the
   * entity Sales tabs); the standalone Orders page passes `tab`.
   */
  tabParamKey?: string;
  /**
   * `location` (the standalone Orders page) shows the extra "Tied to a
   * table" abandoned KPI; `entity` (a staff/table Sales tab) omits it.
   */
  scope?: "location" | "entity";
  /**
   * Active status filter — drives the Orders KPI delta text only. Set by the
   * standalone Orders page; omitted by the entity Sales tabs.
   */
  statusParam?: OrderStatus | "";
  /**
   * Rendered in place of the Orders/Abandoned view (the tab nav + date filter
   * still render above it). The standalone Orders page passes its empty-state
   * element here when the list is empty and unfiltered.
   */
  emptyState?: ReactNode;
}

/**
 * The Orders list body — a date filter, an Orders/Abandoned sub-tab nav, a
 * KPI strip, and the order data tables. Used both location-wide (the
 * standalone `/orders` page, via `scope="location"`) and scoped to a single
 * entity (a staff member or table Sales tab). All filtering, paging, and the
 * date range are URL-driven so the server re-fetches exactly like the Orders
 * page does.
 */
export function OrdersPanel({
  basePath,
  view,
  from,
  to,
  scoped,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
  currency,
  preservedParams,
  tabParamKey = "view",
  scope = "entity",
  statusParam,
  emptyState,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrdersTabNav
          active={view}
          basePath={basePath}
          paramKey={tabParamKey}
          preservedParams={preservedParams}
        />
        <OrdersDateFilter from={from} to={to} />
      </div>

      {emptyState ??
        (view === "orders" ? (
          <OrdersView
            scoped={scoped}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            currency={currency}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
            statusParam={statusParam}
          />
        ) : (
          <AbandonedView
            scoped={scoped}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
            scope={scope}
          />
        ))}
    </div>
  );
}

function OrdersView({
  scoped,
  pageData,
  pageCount,
  pageNo,
  total,
  currency,
  tableMode,
  staffNames,
  tableNames,
  statusParam,
}: {
  scoped: Order[];
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  statusParam?: OrderStatus | "";
}) {
  const openCount = scoped.filter(
    (o) => o.orderStatus === OrderStatus.OPEN,
  ).length;
  const closedCount = scoped.filter(
    (o) => o.orderStatus === OrderStatus.CLOSED,
  ).length;
  const grossTotal = scoped.reduce((sum, o) => sum + (o.grossAmount ?? 0), 0);
  const unpaidTotal = scoped.reduce(
    (sum, o) => sum + (o.unpaidAmount ?? 0),
    0,
  );
  const unpaidCount = scoped.filter(
    (o) => o.paymentStatus && o.paymentStatus !== PaymentStatus.PAID,
  ).length;

  return (
    <>
      <KpiStrip cols={5}>
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={scoped.length.toLocaleString()}
          delta={
            statusParam ? `Filtered: ${statusParam}` : "Across all statuses"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Open"
          value={openCount > 0 ? openCount.toLocaleString() : "—"}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Coins className="h-3 w-3" />}
          label="Closed"
          value={closedCount > 0 ? closedCount.toLocaleString() : "—"}
          deltaTone="pos"
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Gross"
          value={grossTotal > 0 ? formatMoney(grossTotal) : "—"}
          unit={currency}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Banknote className="h-3 w-3" />}
          label="Unpaid"
          value={unpaidTotal > 0 ? formatMoney(unpaidTotal) : "—"}
          unit={currency}
          delta={
            unpaidCount > 0
              ? `${unpaidCount.toLocaleString()} order${unpaidCount === 1 ? "" : "s"}`
              : undefined
          }
          deltaTone={unpaidTotal > 0 ? "neg" : "neutral"}
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <OrdersDataTable
            data={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
          />
        </CardContent>
      </Card>
    </>
  );
}

function AbandonedView({
  scoped,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
  scope,
}: {
  scoped: Order[];
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  scope: "location" | "entity";
}) {
  // Same split as the Orders page: auto-cancels from the end-of-day
  // sweep vs. a manual cancel of an empty order. "Tied to a table" is
  // dropped here — scoped to a single entity it isn't a useful ratio.
  const totalAbandoned = scoped.length;
  const autoAbandoned = scoped.filter((o) =>
    (o.cancellationReason ?? "").toLowerCase().startsWith("auto-cancelled"),
  ).length;
  const manualAbandoned = totalAbandoned - autoAbandoned;
  const withTable = scoped.filter((o) => !!o.tableId).length;

  return (
    <>
      <KpiStrip cols={scope === "location" ? 4 : 3}>
        <KpiCard
          icon={<Ban className="h-3 w-3" />}
          label="Abandoned"
          value={totalAbandoned.toLocaleString()}
          delta="Orders never built out"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Clock className="h-3 w-3" />}
          label="Auto"
          value={autoAbandoned > 0 ? autoAbandoned.toLocaleString() : "—"}
          delta="End-of-day sweep"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Trash2 className="h-3 w-3" />}
          label="Manual"
          value={manualAbandoned > 0 ? manualAbandoned.toLocaleString() : "—"}
          delta="Cancelled with no items"
          deltaTone="neutral"
        />
        {scope === "location" ? (
          <KpiCard
            icon={<Receipt className="h-3 w-3" />}
            label="Tied to a table"
            value={withTable > 0 ? withTable.toLocaleString() : "—"}
            delta="Likely claim auto-release"
            deltaTone="neutral"
          />
        ) : null}
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <AbandonedDataTable
            data={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
          />
        </CardContent>
      </Card>
    </>
  );
}
