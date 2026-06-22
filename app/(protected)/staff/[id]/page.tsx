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
import { listOrders } from "@/lib/actions/order-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { Order, OrderStatus } from "@/types/orders/type";
import { Staff, StaffDetail, StaffAuditEvent } from "@/types/staff";
import { ApiResponse } from "@/types/types";
import { OrdersPanel, type SalesView } from "@/components/orders/orders-panel";
import { StaffDetailView } from "./staff-detail-view";
import { StaffDetailActions } from "./staff-detail-actions";
import { StaffAuditTab } from "./staff-audit-tab";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  tab?: string;
  view?: string;
  from?: string;
  to?: string;
  search?: string;
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
    page: pageParam,
    limit: limitParam,
    auditPage: auditPageParam,
  } = await searchParams;

  if (id === "new") redirect("/staff/new");

  let staff: Staff | null = null;
  let detail: StaffDetail | null = null;

  try {
    // Try the enriched detail first — it bundles gamification, loyalty,
    // and attendance in one round-trip. If the detail endpoint isn't
    // available (e.g. permission, location not selected) we degrade to
    // the basic staff record so the page still renders the profile.
    try {
      detail = await getStaffDetail(id);
      staff = detail?.profile ?? null;
    } catch {
      staff = await getStaff(id);
    }
    if (!staff) notFound();
  } catch {
    throw new Error("Failed to load staff data");
  }

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

  const [allOrders, locationSettings, staffList, tablesList, currency] =
    await Promise.all([
      listOrders({ fromDate: from, toDate: to }).catch((): Order[] => []),
      getLocationSettings().catch(() => null),
      fetchAllStaff().catch(() => []),
      fetchAllTables().catch(() => []),
      getLocationCurrency().catch(() => "TZS"),
    ]);

  // Table-based ordering swaps the lead column to the table name.
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  // Scope to this staff member — orders they're assigned to or closed —
  // then split: the Abandoned sub-tab gets the empty-draft auto-cancels,
  // the Orders sub-tab gets everything else (so the Status column /
  // filter stay meaningful, as on /orders).
  const staffOrders = allOrders.filter(
    (o) => o.assignedTo === id || o.finishedBy === id,
  );
  const scoped =
    view === "abandoned"
      ? staffOrders.filter((o) => o.orderStatus === OrderStatus.ABANDONED)
      : staffOrders.filter((o) => o.orderStatus !== OrderStatus.ABANDONED);

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders: scoped,
      search: q,
      page: pageNo,
      limit,
      staff: staffList,
      tables: tablesList,
    });

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
      scoped={scoped}
      pageData={pageData}
      pageCount={pageCount}
      pageNo={pageNo - 1}
      total={total}
      tableMode={tableMode}
      staffNames={staffNames}
      tableNames={tableNames}
      currency={currency}
      preservedParams={{
        from: fromParam,
        to: toParam,
        search: searchParam,
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
      </PageBody>
    </PageShell>
  );
}
