import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Space, TABLE_SPACE_TYPE_LABELS } from "@/types/space/type";
import {
  getTable,
  getSpace,
  fetchAllTables,
} from "@/lib/actions/space-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { ordersSummary, searchOrders } from "@/lib/actions/order-actions";
import { resolveOrderRowNames } from "@/lib/orders/order-list-view";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { OrderStatus } from "@/types/orders/type";
import { SpaceDetailView } from "@/app/(protected)/spaces/[id]/space-detail-view";
import { OrdersPanel, type SalesView } from "@/components/orders/orders-panel";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  tab?: string;
  view?: string;
  from?: string;
  to?: string;
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
}>;

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const {
    tab,
    view: viewParam,
    from: fromParam,
    to: toParam,
    search: searchParam,
    status: statusFilterParam,
    page: pageParam,
    limit: limitParam,
  } = await searchParams;

  if (id === "new") redirect("/tables/new");

  let space: Space | null = null;
  let redirectTo: string | null = null;
  try {
    space = await getTable(id as UUID);
  } catch {
    try {
      const asSpace = await getSpace(id as UUID);
      redirectTo = `/spaces/${asSpace.id}`;
    } catch {
      /* fall through to notFound */
    }
  }
  if (redirectTo) redirect(redirectTo);
  if (!space) notFound();

  // ── Per-table Sales tab — the Orders list scoped to this table ──────
  // No per-table orders endpoint exists, so pull the location's orders
  // for the chosen range and filter by tableId. Date range, search, the
  // Orders/Abandoned sub-tab, and paging are all URL-driven so this
  // re-fetches exactly like the standalone Orders page. Default to the
  // current month when no range is supplied, matching that page.
  const now = new Date();
  const from = fromParam ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = toParam ?? format(endOfMonth(now), "yyyy-MM-dd");
  const q = searchParam ?? "";
  const pageNo = Number(pageParam) || 1;
  const limit = Number(limitParam) || 10;
  const view: SalesView = viewParam === "abandoned" ? "abandoned" : "orders";
  const statusParam = (statusFilterParam ?? "") as OrderStatus | "";
  const effectiveStatus: OrderStatus | undefined =
    view === "abandoned" ? OrderStatus.ABANDONED : statusParam || undefined;

  // Server-paginated and scoped to this table. KPIs come from the OMS summary
  // with the same scope, so they match the list. The Abandoned sub-tab fixes
  // status to ABANDONED and uses the paged total for its single count.
  const [ordersPage, kpis, locationSettings, staffList, tablesList, currency] =
    await Promise.all([
      searchOrders({
        fromDate: from,
        toDate: to,
        status: effectiveStatus,
        excludeAbandoned: view === "orders",
        tableId: String(space.id),
        search: q || undefined,
        page: pageNo,
        limit,
      }),
      view === "orders"
        ? ordersSummary({
            fromDate: from,
            toDate: to,
            status: effectiveStatus,
            excludeAbandoned: true,
            tableId: String(space.id),
          })
        : Promise.resolve(null),
      getLocationSettings().catch(() => null),
      fetchAllStaff().catch(() => []),
      fetchAllTables().catch(() => []),
      getLocationCurrency().catch(() => "TZS"),
    ]);

  // Table-based ordering swaps the lead column to the table name.
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  const pageData = ordersPage.content ?? [];
  const total = ordersPage.totalElements ?? 0;
  const pageCount = ordersPage.totalPages ?? 0;
  const { staffNames, tableNames } = resolveOrderRowNames(
    pageData,
    staffList,
    tablesList,
  );

  const salesContent = (
    // Keyed because this element is created here but rendered among
    // sibling conditionals inside SpaceDetailView — without a key React's
    // dev validation flags it as a keyless list child (its owner differs
    // from the component that renders it).
    <OrdersPanel
      key="sales-panel"
      basePath={`/tables/${space.id}`}
      view={view}
      from={from}
      to={to}
      kpis={view === "orders" ? (kpis ?? undefined) : undefined}
      pageData={pageData}
      pageCount={pageCount}
      pageNo={pageNo - 1}
      total={total}
      tableMode={tableMode}
      staffNames={staffNames}
      tableNames={tableNames}
      currency={currency}
      statusParam={statusParam}
      preservedParams={{
        from: fromParam,
        to: toParam,
        search: searchParam,
        status: statusFilterParam,
        limit: limitParam,
        tab,
      }}
    />
  );

  // Land on the Sales tab when the URL carries any of its (sales-only)
  // state — a shared or reloaded `?from=…&view=…` link should reopen the
  // view it describes, not fall back to Overview. An explicit `?tab=`
  // still wins.
  const hasSalesParams = !!(
    fromParam ||
    toParam ||
    viewParam ||
    searchParam ||
    statusFilterParam ||
    pageParam ||
    limitParam
  );
  const initialTab = tab ?? (hasSalesParams ? "sales" : undefined);

  const statusLabel = space.active ? "Active" : "Inactive";
  const statusClass = space.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const subtitleParts: string[] = [];
  subtitleParts.push(
    TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type),
  );
  subtitleParts.push(
    space.minCapacity != null
      ? `${space.minCapacity}–${space.capacity} seats`
      : `${space.capacity} seats`,
  );
  if (space.parentSpaceName) subtitleParts.push(space.parentSpaceName);
  if (space.floorPlanName) subtitleParts.push(space.floorPlanName);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Tables", href: "/tables" },
          { title: space.name },
        ]}
      />
      <PageHeader
        title={space.name}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {space.code && (
              <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {space.code}
              </span>
            )}
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/tables/${space.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <SpaceDetailView
          space={space}
          salesContent={salesContent}
          initialTab={initialTab}
        />
      </PageBody>
    </PageShell>
  );
}
