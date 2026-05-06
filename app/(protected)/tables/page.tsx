import Link from "next/link";
import {
  CheckCircle2,
  LayoutGrid,
  Plus,
  Table2,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { tableColumns } from "@/components/tables/space/columns";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { searchTables, getTableStats } from "@/lib/actions/space-actions";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

const EMPTY_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  reservable: 0,
  totalCapacity: 0,
};

export default async function TablesPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search || "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 10;

  const [responseData, stats] = await Promise.all([
    searchTables(q, page, pageLimit),
    getTableStats().catch(() => EMPTY_STATS),
  ]);

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  const totalTables = stats.total;
  const inactiveTables = stats.inactive;
  const activeTables = stats.active;
  const reservableTables = stats.reservable;
  const totalCapacity = stats.totalCapacity;

  const hasFilters = !!q;
  const hasAny = totalTables > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Tables" }]} />
      <PageHeader
        title="Tables"
        subtitle="Bookable tables and seats — what guests actually sit at."
        actions={
          <Button asChild size="sm">
            <Link href="/tables/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add table
            </Link>
          </Button>
        }
      />

      <PageBody>
        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Table2 className="h-3 w-3" />}
                label="Total tables"
                value={totalTables.toLocaleString()}
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Total capacity"
                value={totalCapacity > 0 ? totalCapacity.toLocaleString() : "—"}
                unit={totalCapacity > 0 ? "seats" : undefined}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Reservable"
                value={reservableTables.toLocaleString()}
                deltaTone="neutral"
              />
              <KpiCard
                icon={
                  inactiveTables > 0 ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )
                }
                label="Inactive"
                value={
                  inactiveTables > 0 ? inactiveTables.toLocaleString() : "—"
                }
                deltaTone={inactiveTables > 0 ? "neg" : "neutral"}
                delta={
                  inactiveTables > 0
                    ? `${activeTables.toLocaleString()} active`
                    : undefined
                }
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={tableColumns}
                  data={data}
                  pageCount={pageCount}
                  pageNo={page}
                  searchKey="name"
                  total={total}
                  rowClickBasePath="/tables"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="table" newItemUrl="/tables/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
