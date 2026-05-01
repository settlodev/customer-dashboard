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
import { columns } from "@/components/tables/modifier-group/columns";
import { listModifierGroups } from "@/lib/actions/modifier-actions";
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

  const all = await listModifierGroups().catch(() => []);

  const filtered = all
    .filter((g) =>
      status === "archived" ? g.archivedAt != null : g.archivedAt == null,
    )
    .filter((g) => (q ? g.name.toLowerCase().includes(q) : true));

  const total = filtered.length;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Modifier groups" }]} />
      <PageHeader
        title="Modifier groups"
        subtitle="Reusable groups of customer-facing tweaks (milk type, spice level). Attach a group to any number of products."
        actions={
          <Button asChild>
            <Link href="/modifier-groups/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add group
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/modifier-groups" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={filtered}
                searchKey="name"
                pageNo={0}
                total={total}
                pageCount={1}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems newItemUrl="/modifier-groups/new" itemName="modifier groups" />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
