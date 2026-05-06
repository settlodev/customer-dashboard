import Link from "next/link";
import { Plus, Users, UserCheck, UserX, KeyRound, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/staff/columns";
import {
  getStaffAtLocation,
  getStaffCount,
  searchStaffByName,
} from "@/lib/actions/staff-actions";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { StaffStatusTabs } from "@/components/tables/staff/status-tabs";
import type { StaffListEnriched } from "@/types/staff";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

// Wrap an enriched row with a top-level `id` so the DataTable's
// row-click handler — which reads `(row.original as any).id` to build
// the navigation URL — lands on /staff/{staffId}.
type EnrichedRow = StaffListEnriched & { id: string };

function withId(rows: StaffListEnriched[]): EnrichedRow[] {
  return rows.map((r) => ({ ...r, id: r.staff.id }));
}

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  // Same convention as the products page: URL pager is 1-indexed,
  // backend is 0-indexed, and the conversion lives inside each list
  // action (see staff-actions.tsx). The page just forwards the raw
  // URL values straight through.
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit);
  const status: "active" | "inactive" | "all" =
    resolved.status === "inactive"
      ? "inactive"
      : resolved.status === "all"
        ? "all"
        : "active";

  // Counts roll up at the location level — used both by the KPI strip
  // and by the status tabs so the merchant can see how many people are
  // off-roster at a glance without flipping tabs.
  const counts = await getStaffCount().catch(() => ({
    total: 0,
    active: 0,
    inactive: 0,
  }));

  let rows: EnrichedRow[];
  let total: number;
  let pageCount: number;
  // POS / Dashboard adoption summary — derived from whatever page we
  // load. Acceptable approximation; if the merchant needs exact numbers
  // they can flip to `?status=all` and the next render computes against
  // the full set.
  let posCount = 0;
  let dashboardCount = 0;
  let pinSetCount = 0;

  if (q) {
    // Search returns plain Staff (no enrichment) — wrap each result in
    // an empty enriched envelope so the columns still render.
    const results = await searchStaffByName(q);
    rows = results.map((s) => ({
      id: s.id,
      staff: s,
      gamificationSummary: null as unknown as StaffListEnriched["gamificationSummary"],
      loyaltyPoints: 0,
    }));
    total = results.length;
    pageCount = 1;
  } else {
    // Single source of truth: the dedicated by-location endpoint
    // unions staff anchored at the current location with those
    // cross-assigned via StaffAssignment, and pre-filters by the tab's
    // status so the page never has to reconcile per-location rules or
    // recompute totals on the client.
    const activeFilter =
      status === "all" ? undefined : status === "active";
    const response = await getStaffAtLocation(page, pageLimit, activeFilter);
    const content = response.content ?? [];

    rows = withId(content);
    total = response.totalElements ?? rows.length;
    pageCount = response.totalPages ?? 1;

    for (const r of content) {
      if (r.staff.posAccess) posCount += 1;
      if (r.staff.dashboardAccess) dashboardCount += 1;
      if (r.staff.hasPin) pinSetCount += 1;
    }
  }

  const hasAnyStaff = counts.total > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Staff" }]} />
      <PageHeader
        title="Staff"
        subtitle="People who can sell, manage, or access this location."
        actions={
          <Button asChild size="sm">
            <Link href="/staff/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add staff
            </Link>
          </Button>
        }
      />

      <PageBody>
        {hasAnyStaff || q !== "" ? (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Total"
                value={counts.total.toLocaleString()}
              />
              <KpiCard
                icon={<UserCheck className="h-3 w-3" />}
                label="Active"
                value={counts.active.toLocaleString()}
                deltaTone="pos"
              />
              <KpiCard
                icon={<UserX className="h-3 w-3" />}
                label="Inactive"
                value={
                  counts.inactive > 0 ? counts.inactive.toLocaleString() : "—"
                }
                deltaTone={counts.inactive > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<KeyRound className="h-3 w-3" />}
                label="POS access"
                value={posCount > 0 ? posCount.toLocaleString() : "—"}
                delta={
                  posCount > 0
                    ? `${pinSetCount}/${posCount} PIN set`
                    : undefined
                }
                deltaTone={
                  posCount === 0
                    ? "neutral"
                    : pinSetCount === posCount
                      ? "pos"
                      : "neg"
                }
              />
              <KpiCard
                icon={<Shield className="h-3 w-3" />}
                label="Dashboard"
                value={
                  dashboardCount > 0 ? dashboardCount.toLocaleString() : "—"
                }
              />
            </KpiStrip>

            <StaffStatusTabs
              value={status}
              counts={{
                active: counts.active,
                inactive: counts.inactive,
                all: counts.total,
              }}
            />

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={rows}
                  searchKey="firstName"
                  pageNo={page}
                  total={total}
                  pageCount={pageCount}
                  rowClickBasePath="/staff"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="staff" newItemUrl="/staff/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
