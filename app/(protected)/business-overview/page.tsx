import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { InventoryKpiStrip } from "@/components/widgets/inventory/inventory-kpi-strip";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { getInventoryBusinessDashboardSummary } from "@/lib/actions/reports-analytics-actions";

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

  const summary = await getInventoryBusinessDashboardSummary(
    business.id,
    CURRENCY,
  );

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Business overview" }]} />
      <PageHeader
        title="Business overview"
        subtitle={`${business.name} · aggregated across all locations`}
      />

      <PageBody>
        <InventoryKpiStrip summary={summary} />
      </PageBody>
    </PageShell>
  );
}
