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
import {
  getStaff,
  getStaffDetail,
  fetchAllStaff,
  getStaffAudit,
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
import { StaffDetailView } from "./staff-detail-view";
import { StaffDetailActions } from "./staff-detail-actions";
import { StaffAssignmentsSection } from "@/components/staff/staff-assignments-section";
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

  // Server-paginated and scoped to this staff member (orders they're assigned
  // to OR finished). KPIs come from the OMS summary with the same scope, so
  // they match the list. The Abandoned sub-tab fixes status to ABANDONED and
  // uses the paged total for its single count.
  const [ordersPage, kpis, locationSettings, staffList, tablesList, currency] =
    await Promise.all([
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
      view === "orders"
        ? ordersSummary({
            fromDate: from,
            toDate: to,
            status: effectiveStatus,
            excludeAbandoned: true,
            staffId: id,
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

  // Status pill — Active / Inactive / Owner badge appears separately.
  const statusLabel = staff.active ? "Active" : "Inactive";
  const statusClass = staff.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

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
        items={[
          { title: "Staff", href: "/staff" },
          { title: fullName },
        ]}
      />
      <PageHeader
        title={fullName}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {staff.owner && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
                Owner
              </span>
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
                <Pencil className="mr-1.5 h-4 w-4" />
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
        />
        {!staff.owner && (
          <div className="mt-6 rounded-lg border bg-card p-4">
            <StaffAssignmentsSection
              staffId={staff.id}
              primaryLocationId={staff.locationId}
            />
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}
