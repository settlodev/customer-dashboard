import { Combine, Table2, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/table-combination/column";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { AddCombinationButton } from "@/components/widgets/table-combination/add-combination-button";
import { BookableTablesProvider } from "@/components/widgets/table-combination/bookable-tables-context";
import {
  fetchAllTableCombinations,
  fetchAllTables,
  hydrateCombinations,
  searchTableCombinations,
} from "@/lib/actions/space-actions";
import { TableCombination } from "@/types/space/type";
import { rethrowIfBoundary } from "@/lib/list-fallback";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function TableCombinationsPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit);

  const [response, allTables, allCombos] = await Promise.all([
    searchTableCombinations(q, page, pageLimit).catch((e) => {
      rethrowIfBoundary(e);
      return {
        content: [] as TableCombination[],
        totalElements: 0,
        totalPages: 0,
        size: 0,
        number: 0,
      };
    }),
    fetchAllTables().catch(() => []),
    fetchAllTableCombinations().catch(() => []),
  ]);

  const bookableTables = allTables.filter((t) => t.active);
  const combinations = await hydrateCombinations(response.content, allTables);

  const totalCombos = allCombos.length;
  const totalCapacity = allCombos.reduce((sum, c) => sum + (c.capacity ?? 0), 0);
  const tablesInUse = new Set(allCombos.flatMap((c) => c.tableIds ?? [])).size;

  const total = response.totalElements;
  const pageCount = response.totalPages;

  const hasFilters = !!q;
  const hasAny = totalCombos > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Table combinations" }]} />
      <PageHeader
        title="Table combinations"
        subtitle="Group multiple tables to seat larger parties."
        actions={<AddCombinationButton bookableTables={bookableTables} />}
      />

      <PageBody>
        {hasAny || hasFilters ? (
          <BookableTablesProvider tables={bookableTables}>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<Combine className="h-3 w-3" />}
                label="Total combinations"
                value={totalCombos.toLocaleString()}
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Combined capacity"
                value={
                  totalCapacity > 0 ? totalCapacity.toLocaleString() : "—"
                }
                unit={totalCapacity > 0 ? "seats" : undefined}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Table2 className="h-3 w-3" />}
                label="Tables in use"
                value={tablesInUse > 0 ? tablesInUse.toLocaleString() : "—"}
                delta={
                  bookableTables.length > 0
                    ? `${bookableTables.length} bookable`
                    : undefined
                }
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={combinations}
                  pageCount={pageCount}
                  pageNo={page}
                  searchKey="name"
                  total={total}
                  disableArchive
                />
              </CardContent>
            </Card>
          </BookableTablesProvider>
        ) : (
          <NoItems
            itemName="table combinations"
            cta={<AddCombinationButton bookableTables={bookableTables} />}
          />
        )}
      </PageBody>
    </PageShell>
  );
}
