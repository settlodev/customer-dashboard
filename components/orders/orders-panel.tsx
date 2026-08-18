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

/**
 * Server-sourced KPI values for the Orders strip, fetched from the Reports
 * Service (`/api/v2/analytics/overview`) rather than derived in-memory from the
 * full order set. Used by the standalone Orders page now that the list is
 * server-paginated and no longer holds every order client-side.
 */
export interface OrdersKpis {
  totalOrders: number;
  openOrders: number;
  closedOrders: number;
  grossSales: number;
  /** Count of orders not fully paid. */
  unpaidOrders: number;
}

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
   * Legacy in-memory mode (the staff/table Sales tabs): the full scoped set
   * for the active sub-tab BEFORE search/pagination — KPIs derive from this so
   * the totals don't jump when the user types in the search box. Omitted in
   * server-pagination mode (the standalone Orders page), where `kpis` is passed
   * instead and the list arrives one page at a time.
   */
  scoped?: Order[];
  /**
   * Server-sourced KPI strip (Reports overview). Preferred; when present it
   * drives the Orders KPIs instead of reducing over `scoped`.
   */
  kpis?: OrdersKpis;
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
  kpis,
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
            kpis={kpis}
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
  kpis,
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
  scoped?: Order[];
  kpis?: OrdersKpis;
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
  // Server-pagination mode (standalone Orders page): KPIs come from the Reports
  // overview. Legacy mode (staff/table Sales tabs): derive them from the full
  // in-memory set, exactly as before.
  const rows = scoped ?? [];
  const k: OrdersKpis = kpis ?? {
    totalOrders: rows.length,
    openOrders: rows.filter((o) => o.orderStatus === OrderStatus.OPEN).length,
    closedOrders: rows.filter((o) => o.orderStatus === OrderStatus.CLOSED)
      .length,
    grossSales: rows.reduce((sum, o) => sum + (o.grossAmount ?? 0), 0),
    unpaidOrders: rows.filter(
      (o) => o.paymentStatus && o.paymentStatus !== PaymentStatus.PAID,
    ).length,
  };
  // Legacy mode still surfaces the unpaid *amount* (it holds the full set);
  // server mode has only the count and shows that instead.
  const unpaidAmount = kpis
    ? null
    : rows.reduce((sum, o) => sum + (o.unpaidAmount ?? 0), 0);

  return (
    <>
      <KpiStrip cols={5}>
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={k.totalOrders.toLocaleString()}
          delta={
            statusParam ? `Filtered: ${statusParam}` : "Across all statuses"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Open"
          value={k.openOrders > 0 ? k.openOrders.toLocaleString() : "—"}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Coins className="h-3 w-3" />}
          label="Closed"
          value={k.closedOrders > 0 ? k.closedOrders.toLocaleString() : "—"}
          deltaTone="pos"
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Gross"
          value={k.grossSales > 0 ? formatMoney(k.grossSales) : "—"}
          unit={currency}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Banknote className="h-3 w-3" />}
          label="Unpaid"
          value={
            unpaidAmount != null
              ? unpaidAmount > 0
                ? formatMoney(unpaidAmount)
                : "—"
              : k.unpaidOrders > 0
                ? k.unpaidOrders.toLocaleString()
                : "—"
          }
          unit={unpaidAmount != null ? currency : undefined}
          delta={
            unpaidAmount != null
              ? k.unpaidOrders > 0
                ? `${k.unpaidOrders.toLocaleString()} order${k.unpaidOrders === 1 ? "" : "s"}`
                : undefined
              : k.unpaidOrders > 0
                ? "Awaiting payment"
                : undefined
          }
          deltaTone={k.unpaidOrders > 0 ? "neg" : "neutral"}
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
  scoped?: Order[];
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  scope: "location" | "entity";
}) {
  // Legacy in-memory mode (staff/table tabs) can break the abandoned count
  // into auto-sweep vs manual vs tied-to-a-table. Server mode (the standalone
  // Orders page) only knows the range total, so it shows that single number.
  const legacy = scoped != null;
  const rows = scoped ?? [];
  const totalAbandoned = legacy ? rows.length : total;
  const autoAbandoned = rows.filter((o) =>
    (o.cancellationReason ?? "").toLowerCase().startsWith("auto-cancelled"),
  ).length;
  const manualAbandoned = totalAbandoned - autoAbandoned;
  const withTable = rows.filter((o) => !!o.tableId).length;

  return (
    <>
      {legacy ? (
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
      ) : (
        <KpiStrip cols={2}>
          <KpiCard
            icon={<Ban className="h-3 w-3" />}
            label="Abandoned"
            value={totalAbandoned.toLocaleString()}
            delta="Orders never built out"
            deltaTone="neutral"
          />
        </KpiStrip>
      )}

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
