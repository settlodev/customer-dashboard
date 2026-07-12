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
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoanEligibility } from "@/lib/actions/loans-actions";
import { getLoanAccess } from "@/lib/loans/access";
import { EligibilityHero } from "@/components/loans/eligibility-hero";

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

  // Financing eligibility (feature-flagged + permission-gated). Shown only to
  // users with loans:read; the Apply CTA needs loans:apply.
  const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;
  const loanEligibility =
    LOANS_ENABLED && loanAccess?.canRead ? await getLoanEligibility(business.id) : null;
  // The active-loan "repaying" hero needs the borrower loan-detail wired (a follow-up slice);
  // until then render the pre-qualified layout for everyone.
  const activeLoan = null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Business overview" }]} />
      <PageHeader
        title="Business overview"
        subtitle={`${business.name} · aggregated across all locations`}
      />

      <PageBody>
        {LOANS_ENABLED && loanAccess?.canRead && loanEligibility && loanEligibility.limit > 0 && (
          <EligibilityHero
            eligibility={loanEligibility}
            activeLoan={activeLoan}
            canApply={loanAccess.canApply}
          />
        )}
        <InventoryKpiStrip summary={summary} />
        <ProductsKpiStrip summary={productsKpi} />
      </PageBody>
    </PageShell>
  );
}
