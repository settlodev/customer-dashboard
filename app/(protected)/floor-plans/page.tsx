import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import FloorPlanManager from "@/components/forms/floor_plan_form";
import { ListPagination } from "@/components/tables/list-pagination";
import { searchFloorPlans } from "@/lib/actions/space-actions";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function FloorPlansPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const page = Number(resolved.page) || 1;
  const pageLimit = Number(resolved.limit) || 10;

  const response = await searchFloorPlans("", page, pageLimit);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Floor plans" }]} />
      <PageHeader
        title="Floor plans"
        subtitle="Visual layouts that organise where your tables and spaces sit on the floor."
      />
      <PageBody>
        <FloorPlanManager floorPlans={response.content} />
        <ListPagination
          page={page}
          pageCount={response.totalPages}
          totalElements={response.totalElements}
          pageLimit={pageLimit}
          basePath="/floor-plans"
        />
      </PageBody>
    </PageShell>
  );
}
