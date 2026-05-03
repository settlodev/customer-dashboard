import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { InventoryKpiStrip } from "@/components/widgets/inventory/inventory-kpi-strip";
import { ProductsKpiStrip } from "@/components/widgets/products/products-kpi-strip";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import {
  getInventoryBusinessDashboardSummary,
  getProductsBusinessKpi,
} from "@/lib/actions/reports-analytics-actions";

const CURRENCY = "TZS";

export default async function BusinessOverviewPage() {
  const business = await getCurrentBusiness();

  if (!business) {
    return (
      <PageShell>
        <PageBreadcrumbs items={[{ title: "Business overview" }]} />
        <PageHeader
          title="Business overview"
          subtitle="No business selected — pick one from the switcher to continue."
        />
      </PageShell>
    );
  }

  const [summary, productsKpi] = await Promise.all([
    getInventoryBusinessDashboardSummary(business.id, CURRENCY),
    getProductsBusinessKpi(business.id, CURRENCY),
  ]);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Business overview" }]} />
      <PageHeader
        title="Business overview"
        subtitle={`${business.name} · aggregated across all locations`}
      />

      <PageBody>
        <InventoryKpiStrip summary={summary} />
        <ProductsKpiStrip summary={productsKpi} />
      </PageBody>
    </PageShell>
  );
}
