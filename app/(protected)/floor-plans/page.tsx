import { LayoutGrid, Star, Ruler } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/floor-plan/column";
import {
  fetchAllFloorPlans,
  searchFloorPlans,
} from "@/lib/actions/space-actions";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { AddFloorPlanButton } from "@/components/widgets/floor-plan/add-floor-plan-button";
import { FloorPlan } from "@/types/space/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function FloorPlansPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit);

  const [allPlans, response] = await Promise.all([
    fetchAllFloorPlans().catch(() => [] as FloorPlan[]),
    searchFloorPlans(q, page, pageLimit).catch(() => ({
      content: [] as FloorPlan[],
      totalElements: 0,
      totalPages: 0,
      size: 0,
      number: 0,
    })),
  ]);

  const totalPlans = allPlans.length;
  const defaultPlan = allPlans.find((p) => p.isDefault);
  const sized = allPlans.filter((p) => p.width && p.height).length;

  const data: FloorPlan[] = response.content;
  const total = response.totalElements;
  const pageCount = response.totalPages;

  const hasFilters = !!q;
  const hasAny = totalPlans > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Floor plans" }]} />
      <PageHeader
        title="Floor plans"
        subtitle="Visual layouts that organise where your tables and spaces sit on the floor."
        actions={<AddFloorPlanButton />}
      />

      <PageBody>
        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Total plans"
                value={totalPlans.toLocaleString()}
              />
              <KpiCard
                icon={<Star className="h-3 w-3" />}
                label="Default"
                value={defaultPlan ? defaultPlan.name : "—"}
                deltaTone={defaultPlan ? "pos" : "neutral"}
              />
              <KpiCard
                icon={<Ruler className="h-3 w-3" />}
                label="With dimensions"
                value={sized > 0 ? sized.toLocaleString() : "—"}
                delta={
                  sized > 0 ? `${sized} of ${totalPlans} sized` : undefined
                }
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  pageNo={page}
                  searchKey="name"
                  total={total}
                  disableArchive
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="floor plans" cta={<AddFloorPlanButton />} />
        )}
      </PageBody>
    </PageShell>
  );
}
