import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";
import { columns } from "@/components/tables/department/columns";
import {
  getDepartmentCount,
  searchDepartment,
} from "@/lib/actions/department-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getEntityEntitlements } from "@/lib/actions/entitlement-actions";
import { UpgradeGate } from "@/components/widgets/upgrade-gate";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  // DEPARTMENTS_MODULE entitlement gate. The auto-created Main department
  // still exists for every location regardless — this only hides the
  // CRUD surface for packages that don't include the feature.
  const currentLocation = await getCurrentLocation();
  const locationId = currentLocation?.id;
  const entitlement = locationId
    ? await getEntityEntitlements(locationId)
    : null;
  if (locationId) {
    const allowed = entitlement
      ? entitlement.features["DEPARTMENTS_MODULE"] === true
      : true;
    if (!allowed) {
      return (
        <PageShell>
          <PageBreadcrumbs items={[{ title: "Departments" }]} />
          <PageHeader title="Departments" />
          <PageBody>
            <UpgradeGate
              featureName="Departments"
              description="Multi-department management is available on Professional and Enterprise plans. Your location still has a default Main department for day-to-day use."
            />
          </PageBody>
        </PageShell>
      );
    }
  }

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status = parseListStatus(resolvedSearchParams.status);

  const maxAllowed = entitlement?.limits["MAX_DEPARTMENTS"];

  // Departments and MAX_DEPARTMENTS are both per LOCATION, so the list and
  // the cap headroom are scoped to the active location. The headroom comes
  // from the count endpoint because that is the exact number Accounts checks
  // on create (non-deleted rows, deactivated included) — the paged total was
  // previously an account-wide figure, so a two-location account read as
  // "2 of 2 used" before either location had added anything.
  const [responseData, count] = await Promise.all([
    softFetch(searchDepartment(q, page, pageLimit, locationId)),
    locationId ? softFetch(getDepartmentCount(locationId)) : null,
  ]);

  // Departments don't carry an `archivedAt` timestamp; the
  // `active` boolean acts as the soft-delete proxy. Treat
  // inactive rows as "archived" so the toggle still works the
  // same way as the rest of the inventory section.
  const data = (responseData?.content ?? []).filter((d) =>
    status === "archived" ? !d.active : d.active,
  );
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;
  const used = count?.total ?? total;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Departments" }]} />
      <PageHeader
        title="Departments"
        subtitle={
          maxAllowed !== undefined && maxAllowed !== -1
            ? `Top-level grouping above categories. ${used} of ${maxAllowed} used.`
            : "Top-level grouping above categories."
        }
        actions={
          maxAllowed !== undefined &&
          maxAllowed !== -1 &&
          used >= maxAllowed ? (
            <Button disabled title={`Your plan caps you at ${maxAllowed} departments per location`}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Department
            </Button>
          ) : (
            <Button asChild>
              <Link href="/departments/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Department
              </Link>
            </Button>
          )
        }
      />

      <PageBody>
        <StatusTabs basePath="/departments" value={status} />

        {!responseData ? (
          <DataLoadError itemName="departments" />
        ) : total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
                rowClickBasePath="/departments"
                disableArchive
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="departments" newItemUrl="/departments/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
