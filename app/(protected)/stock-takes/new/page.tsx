import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockTakeForm from "@/components/forms/stock-take-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";

export default async function NewStockTakePage() {
  const config = await getLocationConfig();
  if (!config?.cycleCountingEnabled) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Takes", href: "/stock-takes" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Stock Take"
        subtitle="Draft → Start (snapshots on-hand) → record counts → Complete → Approve (auto-generates variance adjustments)."
      />
      <PageBody>
        <StockTakeForm />
      </PageBody>
    </PageShell>
  );
}
