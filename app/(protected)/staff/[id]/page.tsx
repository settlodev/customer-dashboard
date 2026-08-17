import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  differenceInMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusPill } from "@/components/layouts/order-detail";
import { Button } from "@/components/ui/button";
import {
  getStaff,
  getStaffDetail,
  fetchAllStaff,
  getStaffAudit,
  staffReport,
} from "@/lib/actions/staff-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { ordersSummary, searchOrders } from "@/lib/actions/order-actions";
import { resolveOrderRowNames } from "@/lib/orders/order-list-view";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { OrderStatus } from "@/types/orders/type";
import { Staff, StaffDetail, StaffAuditEvent } from "@/types/staff";
import { ApiResponse } from "@/types/types";
import { OrdersPanel, type SalesView } from "@/components/orders/orders-panel";
import { StaffDetailView, type StaffSalesMetrics } from "./staff-detail-view";
import { StaffDetailActions } from "./staff-detail-actions";
import { StaffAuditTab } from "./staff-audit-tab";

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
  auditPage?: string;
}>;

export default async function StaffPage({
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
    auditPage: auditPageParam,
  } = await searchParams;

  if (id === "new") redirect("/staff/new");

  let staff: Staff | null = null;
  let detail: StaffDetail | null = null;

  // Try the enriched detail first — it bundles gamification, loyalty, and
  // attendance in one round-trip. If the detail endpoint isn't available
  // (e.g. permission, location not selected) we degrade to the basic staff
  // record so the page still renders the profile. Auth/permission errors are
  // re-thrown so (protected)/error.tsx can route them; everything else falls
  // through to the notFound() below.
  try {
    detail = await getStaffDetail(id);
    staff = detail?.profile ?? null;
  } catch (e) {
    rethrowIfBoundary(e);
    try {
      staff = await getStaff(id);
    } catch (err) {
      rethrowIfBoundary(err);
      staff = null;
    }
  }

  // Unknown / non-existent id — e.g. a "Sales by staff" row whose order was
  // attributed to a non-staff actor id (an owner/device/user subject that has
  // no staff record). Render the standard 404 page instead of throwing and
  // crashing the whole Server Component render. notFound() stays OUTSIDE the
  // try above so its control-flow signal isn't swallowed into a 500.
  if (!staff) notFound();

  // ── Per-staff Sales tab — the Orders list scoped to this staff ──────
  // Mirrors the per-table Sales tab: no per-staff orders endpoint exists,
  // so pull the location's orders for the chosen range and keep the ones
  // this staff member is assigned to or closed. Date range, search, the
  // Orders/Abandoned sub-tab, and paging are all URL-driven. Default to
  // the current month when no range is supplied, matching /orders.
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

  // The rail's trade figures are deliberately status-agnostic — they answer
  // "what did this person sell in this range", not "what does the current
  // filter show". When the Sales tab carries no status filter the two are the
  // same request, so reuse the promise instead of asking OMS twice.
  const railKpisPromise = ordersSummary({
    fromDate: from,
    toDate: to,
    excludeAbandoned: true,
    staffId: id,
  });
  const salesKpisPromise =
    view !== "orders"
      ? Promise.resolve(null)
      : statusParam
        ? ordersSummary({
            fromDate: from,
            toDate: to,
            status: effectiveStatus,
            excludeAbandoned: true,
            staffId: id,
          })
        : railKpisPromise;

  // Server-paginated and scoped to this staff member (orders they're assigned
  // to OR finished). KPIs come from the OMS summary with the same scope, so
  // they match the list. The Abandoned sub-tab fixes status to ABANDONED and
  // uses the paged total for its single count.
  const [
    ordersPage,
    railKpis,
    kpis,
    locationSettings,
    staffList,
    tablesList,
    currency,
    rollup,
  ] = await Promise.all([
    searchOrders({
      fromDate: from,
      toDate: to,
      status: effectiveStatus,
      excludeAbandoned: view === "orders",
      staffId: id,
      search: q || undefined,
      page: pageNo,
      limit,
    }),
    railKpisPromise,
    salesKpisPromise,
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
    getLocationCurrency().catch(() => "TZS"),
    // Reports rollup — net / profit / items sold plus the location comparison
    // that turns this staff member's number into a ranking. Null when the
    // analytics service is unreachable or the viewer lacks reports access;
    // the rail falls back to the OMS gross figure in that case.
    staffReport(from, to).catch(() => null),
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

  // ── Rail metrics ────────────────────────────────────────────────────
  const rollupRows = rollup?.staffReports ?? null;
  const mine = rollupRows?.find((r) => r.id === staff.id) ?? null;
  const locationNet =
    rollupRows?.reduce((sum, r) => sum + (r.totalNetAmount ?? 0), 0) ?? 0;
  // Rank among staff who actually sold — a leaderboard of one entry per
  // idle colleague would be meaningless.
  const sellers = (rollupRows ?? [])
    .filter((r) => (r.totalNetAmount ?? 0) > 0)
    .sort((a, b) => b.totalNetAmount - a.totalNetAmount);
  const rankIdx = sellers.findIndex((r) => r.id === staff.id);

  const metrics: StaffSalesMetrics = {
    rangeLabel: formatRange(from, to),
    orders: railKpis?.totalOrders ?? 0,
    openOrders: railKpis?.openOrders ?? 0,
    closedOrders: railKpis?.closedOrders ?? 0,
    unpaidOrders: railKpis?.unpaidOrders ?? 0,
    grossSales: railKpis?.grossSales ?? 0,
    netSales: rollupRows ? (mine?.totalNetAmount ?? 0) : null,
    grossProfit: rollupRows ? (mine?.totalGrossProfit ?? 0) : null,
    itemsSold: rollupRows ? (mine?.totalItemsSold ?? 0) : null,
    ordersCompleted: rollupRows ? (mine?.totalOrdersCompleted ?? 0) : null,
    rank: rankIdx >= 0 ? rankIdx + 1 : null,
    peers: sellers.length,
    sharePct:
      mine && locationNet > 0
        ? (mine.totalNetAmount / locationNet) * 100
        : null,
  };

  const salesContent = (
    // Keyed because this element is created here but rendered among
    // sibling conditionals inside StaffDetailView — without a key React's
    // dev validation flags it as a keyless list child.
    <OrdersPanel
      key="sales-panel"
      basePath={`/staff/${id}`}
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

  // ── Audit tab ─────────────────────────────────────────────────────────
  const auditPageNo = Number(auditPageParam) || 1;
  const auditData = await getStaffAudit(staff.id, auditPageNo, 20).catch(
    () => ({ content: [], totalElements: 0, totalPages: 1 } as unknown as ApiResponse<StaffAuditEvent>),
  );
  const auditContent = (
    <StaffAuditTab staffId={staff.id} data={auditData} page={auditPageNo} />
  );

  // Land on the Sales tab when the URL carries any of its (sales-only)
  // state — a shared or reloaded link should reopen the view it
  // describes, not fall back to Overview. An explicit `?tab=` still wins.
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

  const fullName = `${staff.firstName} ${staff.lastName}`;

  // Subtitle reads "Job · Department · Roles" — collapses dividers when
  // any segment is missing so we don't end up with stray bullets.
  const subtitleParts: string[] = [];
  if (staff.jobTitle) subtitleParts.push(staff.jobTitle);
  if (staff.departmentName) subtitleParts.push(staff.departmentName);
  if (staff.roles?.length) {
    const roleList = staff.roles
      .slice(0, 3)
      .map((r) => r.name)
      .join(", ");
    const more = staff.roles.length > 3 ? ` +${staff.roles.length - 3}` : "";
    subtitleParts.push(`${roleList}${more}`);
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Staff", href: "/staff" }, { title: fullName }]}
      />
      <PageHeader
        title={
          <>
            <StaffAvatar staff={staff} />
            {fullName}
          </>
        }
        titleAccessory={
          <span className="flex items-center gap-2">
            <StatusPill tone={staff.active ? "pos" : "muted"} dot>
              {staff.active ? "Active" : "Inactive"}
            </StatusPill>
            {staff.owner && <StatusPill tone="warn">Owner</StatusPill>}
            {!staff.dashboardAccess && !staff.posAccess && staff.active && (
              <StatusPill tone="muted">No access</StatusPill>
            )}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/staff/${staff.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <StaffDetailActions staff={staff} />
          </>
        }
      />

      <PageBody>
        <StaffDetailView
          staff={staff}
          detail={detail}
          initialTab={initialTab}
          salesContent={salesContent}
          auditContent={auditContent}
          metrics={metrics}
          currency={currency}
          tenureLabel={tenureOf(staff.joiningDate)}
        />
      </PageBody>
    </PageShell>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────

/** Circular avatar for the page title — picture when set, else initials on
 *  the staff member's roster colour. */
function StaffAvatar({ staff }: { staff: Staff }) {
  const initials =
    `${staff.firstName?.[0] ?? ""}${staff.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  if (staff.pictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={staff.pictureUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full border border-line object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-canvas text-[15px] font-bold tracking-tight text-ink-2"
      style={
        staff.color ? { background: staff.color, color: "#fff", borderColor: staff.color } : undefined
      }
    >
      {initials}
    </span>
  );
}

/** "Aug 17, 2026" for a single day, else "Aug 1 – Aug 17, 2026". */
function formatRange(from: string, to: string): string {
  try {
    const start = parseISO(from);
    const end = parseISO(to);
    if (from === to) return format(start, "MMM d, yyyy");
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${from} – ${to}`;
  }
}

/** "2 yr 4 mo" — computed here so no `Date.now()` seeds the client render. */
function tenureOf(joiningDate: string | null): string | null {
  if (!joiningDate) return null;
  const joined = parseISO(joiningDate);
  if (Number.isNaN(joined.getTime())) return null;
  const months = differenceInMonths(new Date(), joined);
  if (months < 0) return null;
  if (months < 1) return "under a month";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} mo`;
  return rest > 0 ? `${years} yr ${rest} mo` : `${years} yr`;
}
