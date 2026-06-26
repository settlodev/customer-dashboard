import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/roles/columns";
import { fetchRolesForCurrentDestination } from "@/lib/actions/role-actions";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Role } from "@/types/roles/type";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";

export default async function Page() {
  // Scope to the active destination (location/store/warehouse) plus the
  // account-wide roles — never the unfiltered, cross-location list that made
  // per-location roles look duplicated.
  const roles: Role[] | null = await softFetch(
    fetchRolesForCurrentDestination({ includeAccountRoles: true }),
  );

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Roles" }]} />
      <PageHeader
        title="Roles"
        subtitle="Define permissions and access levels for staff."
        actions={
          <Button asChild size="sm">
            <Link href="/roles/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Role
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!roles ? (
          <DataLoadError itemName="roles" />
        ) : roles.length > 0 ? (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <DataTable
                columns={columns}
                clientMode
                data={roles}
                pageCount={1}
                pageNo={0}
                searchKey="name"
                total={roles.length}
                rowClickBasePath="/roles"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="roles" newItemUrl="/roles/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
