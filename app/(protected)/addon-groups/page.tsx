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
import { columns } from "@/components/tables/addon-group/columns";
import { listAddonGroups } from "@/lib/actions/addon-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams.search || "").trim().toLowerCase();
  const status = parseListStatus(resolvedSearchParams.status);

  const all = await listAddonGroups().catch((e) => {
    rethrowIfBoundary(e);
    return [];
  });

  const filtered = all
    .filter((g) =>
      status === "archived" ? g.archivedAt != null : g.archivedAt == null,
    )
    .filter((g) => (q ? g.name.toLowerCase().includes(q) : true));

  const total = filtered.length;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Addon groups" }]} />
      <PageHeader
        title="Addon groups"
        subtitle="Optional add-ons offered alongside products."
        actions={
          <Button asChild>
            <Link href="/addon-groups/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add group
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/addon-groups" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                clientMode
                data={filtered}
                searchKey="name"
                pageNo={0}
                total={total}
                pageCount={1}
                rowClickBasePath="/addon-groups"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems newItemUrl="/addon-groups/new" itemName="addon groups" />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
