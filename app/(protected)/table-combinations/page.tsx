import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import TableCombinationManager from "@/components/forms/table_combination_form";
import { ListPagination } from "@/components/tables/list-pagination";
import {
  fetchAllTables,
  hydrateCombinations,
  searchTableCombinations,
} from "@/lib/actions/space-actions";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function TableCombinationsPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const page = Number(resolved.page) || 1;
  const pageLimit = Number(resolved.limit) || 10;

  const [response, allTables] = await Promise.all([
    searchTableCombinations("", page, pageLimit),
    fetchAllTables().catch(() => []),
  ]);

  const combinations = await hydrateCombinations(response.content, allTables);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Table combinations" }]} />
      <PageHeader
        title="Table combinations"
        subtitle="Group multiple tables to seat larger parties."
      />
      <PageBody>
        <TableCombinationManager
          combinations={combinations}
          allTables={allTables}
        />
        <ListPagination
          page={page}
          pageCount={response.totalPages}
          totalElements={response.totalElements}
          pageLimit={pageLimit}
          basePath="/table-combinations"
        />
      </PageBody>
    </PageShell>
  );
}
