import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockTakeForm from "@/components/forms/stock-take-form";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import { getCurrentDestination } from "@/lib/actions/context";

export default async function NewStockTakePage() {
  const [config, destination] = await Promise.all([
    getLocationConfig(),
    getCurrentDestination(),
  ]);
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
        <StockTakeForm destinationType={destination?.type ?? "LOCATION"} />
      </PageBody>
    </PageShell>
  );
}
