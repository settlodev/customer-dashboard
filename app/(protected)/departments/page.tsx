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
import { searchDepartment } from "@/lib/actions/department-actions";
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
  if (currentLocation?.id) {
    const item = await getEntityEntitlements(currentLocation.id);
    const allowed = item ? item.features["DEPARTMENTS_MODULE"] === true : true;
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

  const maxAllowed = currentLocation?.id
    ? (await getEntityEntitlements(currentLocation.id))?.limits["MAX_DEPARTMENTS"]
    : undefined;

  const responseData = await softFetch(searchDepartment(q, page, pageLimit));

  // Departments don't carry an `archivedAt` timestamp; the
  // `active` boolean acts as the soft-delete proxy. Treat
  // inactive rows as "archived" so the toggle still works the
  // same way as the rest of the inventory section.
  const data = (responseData?.content ?? []).filter((d) =>
    status === "archived" ? !d.active : d.active,
  );
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Departments" }]} />
      <PageHeader
        title="Departments"
        subtitle={
          maxAllowed !== undefined && maxAllowed !== -1
            ? `Top-level grouping above categories. ${total} of ${maxAllowed} used.`
            : "Top-level grouping above categories."
        }
        actions={
          maxAllowed !== undefined &&
          maxAllowed !== -1 &&
          total >= maxAllowed ? (
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
