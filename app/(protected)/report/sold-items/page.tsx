import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Ban,
  Boxes,
  Layers,
  PackageCheck,
  ReceiptText,
  RotateCcw,
} from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { SoldItemsStatusToggle } from "@/components/reports/sold-items/sold-items-status-toggle";
import { SoldItemsTable } from "@/components/reports/sold-items/sold-items-table";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { listSoldItems } from "@/lib/actions/product-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import {
  type SoldItemLine,
  type SoldItemStatus,
} from "@/types/reports/sold-items";

const DEFAULT_LIMIT = 500;
const VALID_STATUSES: SoldItemStatus[] = [
  "SOLD",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "VOIDED",
];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
};

const formatNum = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Multi-field search matcher — covers product name, variant, category,
 * the order number and the resolved table name. Keeps `?search=` working
 * as a single global filter across the table without depending on the
 * column-key search.
 */
const matchesSearch = (
  item: SoldItemLine,
  q: string,
  tableNames: Record<string, string>,
): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  const tableName = item.tableId ? (tableNames[item.tableId] ?? "") : "";
  return (
    item.productName.toLowerCase().includes(needle) ||
    (item.variantName ?? "").toLowerCase().includes(needle) ||
    (item.categoryName ?? "").toLowerCase().includes(needle) ||
    item.orderNumber.toLowerCase().includes(needle) ||
    tableName.toLowerCase().includes(needle)
  );
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  const statusParam = resolved.status ?? "";
  const status: SoldItemStatus | "" = VALID_STATUSES.includes(
    statusParam as SoldItemStatus,
  )
    ? (statusParam as SoldItemStatus)
    : "";

  // Default to current month — matches the rest of the report screens.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const [report, tables, locationSettings] = await Promise.all([
    listSoldItems({
      fromDate: from,
      toDate: to,
      status: status || undefined,
      limit: DEFAULT_LIMIT,
    }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
    // Each line carries only a table_id (the Reports Service stores no
    // table names); resolve the display names from the OMS tables list,
    // same as the orders list and the Sales → By table report.
    fetchAllTables().catch(() => []),
    getLocationSettings().catch(() => null),
  ]);

  const tableNames: Record<string, string> = {};
  for (const t of tables) tableNames[t.id] = t.name;

  // Table-based ordering leads the Order column with the table name; the
  // standard mode keeps the order number in front (same as /orders).
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  const items = report?.items ?? [];
  const filtered = items.filter((item) => matchesSearch(item, q, tableNames));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  const hasAny = items.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters = q !== "" || statusParam !== "" || !isDefaultRange;

  const subtitle =
    from === to
      ? `Lines sold on ${format(new Date(from), "MMM d, yyyy")}`
      : `Lines sold ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Sold items" }]} />
      <PageHeader title="Sold items" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SoldItemsStatusToggle active={status} />
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          <ReportBody
            report={report}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={page - 1}
            total={total}
            tableMode={tableMode}
            tableNames={tableNames}
          />
        ) : (
          <NoItems itemName="sold items" />
        )}
      </PageBody>
    </PageShell>
  );
}

function ReportBody({
  report,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  tableNames,
}: {
  report: Awaited<ReturnType<typeof listSoldItems>>;
  pageData: SoldItemLine[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  tableNames: Record<string, string>;
}) {
  // KPIs are derived from the server-side summary so they stay stable
  // when the client paginates / searches. Empty fields fall back to "—"
  // so the strip doesn't render misleading zeroes on first paint.
  const summary = report?.summary;
  const totalLines = summary?.totalLines ?? 0;
  const totalUnits = summary?.totalUnitsSold ?? 0;
  const refundedUnits = summary?.totalRefundedUnits ?? 0;
  const voidedLines = summary?.totalVoidedLines ?? 0;
  const uniqueProducts = summary?.uniqueProductCount ?? 0;
  const uniqueOrders = summary?.uniqueOrderCount ?? 0;
  const uniqueStaff = summary?.uniqueStaffCount ?? 0;

  return (
    <>
      <KpiStrip cols={6}>
        <KpiCard
          icon={<Boxes className="h-3 w-3" />}
          label="Lines"
          value={totalLines > 0 ? totalLines.toLocaleString() : "—"}
          delta="OrderItem rows in range"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackageCheck className="h-3 w-3" />}
          label="Units sold"
          value={totalUnits > 0 ? formatNum(totalUnits) : "—"}
          delta={
            refundedUnits > 0
              ? `${formatNum(refundedUnits)} refunded`
              : "All retained"
          }
          deltaTone={refundedUnits > 0 ? "neg" : "neutral"}
        />
        <KpiCard
          icon={<RotateCcw className="h-3 w-3" />}
          label="Refunded units"
          value={refundedUnits > 0 ? formatNum(refundedUnits) : "—"}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Ban className="h-3 w-3" />}
          label="Voided"
          value={voidedLines > 0 ? voidedLines.toLocaleString() : "—"}
          delta="Lines removed before sale"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Layers className="h-3 w-3" />}
          label="Products"
          value={uniqueProducts > 0 ? uniqueProducts.toLocaleString() : "—"}
          delta={
            uniqueStaff > 0
              ? `${uniqueStaff.toLocaleString()} staff active`
              : undefined
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={uniqueOrders > 0 ? uniqueOrders.toLocaleString() : "—"}
          delta="Distinct orders"
          deltaTone="neutral"
        />
      </KpiStrip>

      <SoldItemsTable
        data={pageData}
        pageCount={pageCount}
        pageNo={pageNo}
        total={total}
        tableMode={tableMode}
        tableNames={tableNames}
      />
    </>
  );
}
