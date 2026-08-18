import { redirect } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import ProviderSettlementForm from "@/components/forms/provider_settlement_form";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getAccountingLocationSettings } from "@/lib/actions/accounting-location-settings-actions";

export default async function NewProviderSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentMethodId?: string; code?: string }>;
}) {
  const { paymentMethodId, code } = await searchParams;

  // Location and settings are independent — fire in parallel; the redirect
  // gate still runs first against the resolved location, but we don't pay
  // the settings fetch cost serially behind location.
  const [location, settings] = await Promise.all([
    getCurrentLocation(),
    getAccountingLocationSettings(),
  ]);
  if (!location?.id || !paymentMethodId) {
    redirect("/accounting/provider-settlements");
  }
  const defaultCurrency = settings.currency || settings.defaultCurrency || "TZS";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Accounting" },
          {
            title: "Provider settlements",
            href: "/accounting/provider-settlements",
          },
          { title: "Record payout" },
        ]}
      />
      <PageHeader
        title="Record provider payout"
        subtitle="Record a provider's deposit against their outstanding balance, net of commission."
      />
      <PageBody>
        <ProviderSettlementForm
          paymentMethodId={paymentMethodId}
          paymentMethodCode={code ?? ""}
          locationId={location.id}
          defaultCurrency={defaultCurrency}
        />
      </PageBody>
    </PageShell>
  );
}
