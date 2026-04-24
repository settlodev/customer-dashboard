import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import BomAnalyticsDashboard from "@/components/widgets/bom/bom-analytics-dashboard";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import {
  getCostCascades,
  getDeductionFailures,
  getMissingRules,
  getProductionYield,
  getRecipeCostTrend,
  getSubstituteUsage,
} from "@/lib/actions/bom-analytics-actions";

const breadcrumbItems = [{ title: "Consumption analytics", link: "/bom-analytics" }];

export default async function BomAnalyticsPage() {
  const business = await getCurrentBusiness();
  const businessId = business?.id;
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const endDate = today.toISOString().slice(0, 10);

  // Fetch everything in parallel. Each call returns empty on failure so the
  // dashboard degrades gracefully when Reports Service is unavailable or
  // a business has no BOM activity yet.
  const [
    costTrend,
    substituteUsage,
    missingRules,
    deductionFailures,
    productionYield,
    costCascades,
  ] = businessId
    ? await Promise.all([
        getRecipeCostTrend({ businessId, startDate, endDate }),
        getSubstituteUsage({ businessId, startDate, endDate }),
        getMissingRules({ businessId, startDate, endDate }),
        getDeductionFailures({ businessId, startDate, endDate, page: 0, size: 25 }),
        getProductionYield({ businessId, startDate, endDate }),
        getCostCascades({ businessId, startDate, endDate, minRules: 1 }),
      ])
    : [
        [] as Awaited<ReturnType<typeof getRecipeCostTrend>>,
        [] as Awaited<ReturnType<typeof getSubstituteUsage>>,
        [] as Awaited<ReturnType<typeof getMissingRules>>,
        {
          content: [],
          page: 0,
          size: 25,
          totalElements: 0,
          totalPages: 0,
          last: true,
        } as Awaited<ReturnType<typeof getDeductionFailures>>,
        [] as Awaited<ReturnType<typeof getProductionYield>>,
        [] as Awaited<ReturnType<typeof getCostCascades>>,
      ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BreadcrumbsNav items={breadcrumbItems} />
          <p className="text-sm text-muted-foreground mt-1">
            Recipe cost trends, substitute usage, missing-rule alerts, production yield,
            and the raw-material cost cascade blast radius — all backed by the Reports
            Service.
          </p>
        </div>
      </div>

      {!businessId ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No business selected. Pick a business to view consumption analytics.
          </CardContent>
        </Card>
      ) : (
        <BomAnalyticsDashboard
          businessId={businessId}
          initialStartDate={startDate}
          initialEndDate={endDate}
          costTrend={costTrend}
          substituteUsage={substituteUsage}
          missingRules={missingRules}
          deductionFailures={deductionFailures}
          productionYield={productionYield}
          costCascades={costCascades}
        />
      )}
    </div>
  );
}
