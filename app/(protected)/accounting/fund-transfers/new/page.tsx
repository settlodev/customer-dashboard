import { redirect } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import FundTransferForm from "@/components/forms/fund_transfer_form";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getAccountingLocationSettings } from "@/lib/actions/accounting-location-settings-actions";

export default async function NewFundTransferPage() {
  const location = await getCurrentLocation();
  if (!location?.id) redirect("/accounting/fund-transfers");
  const settings = await getAccountingLocationSettings();
  const defaultCurrency = settings.currency || settings.defaultCurrency || "TZS";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Accounting" },
          {
            title: "Fund transfers",
            href: "/accounting/fund-transfers",
          },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Record fund transfer"
        subtitle="Move balance between two asset accounts at this location."
      />
      <PageBody>
        <FundTransferForm locationId={location.id} defaultCurrency={defaultCurrency} />
      </PageBody>
    </PageShell>
  );
}
