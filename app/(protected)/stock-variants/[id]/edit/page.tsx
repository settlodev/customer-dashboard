import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getStock } from "@/lib/actions/stock-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import StockForm from "@/components/forms/stock_form";

type Params = Promise<{ id: string }>;

export default async function EditStockPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  // Stock, location, and balances are all independent — parallelise so
  // the edit page TTFB tracks the slowest of the three rather than
  // their sum. Balances chains off the location promise (since it needs
  // location.id), but still kicks off as soon as location resolves.
  const locationPromise = getCurrentLocation();
  const balancesPromise = locationPromise.then((loc) =>
    loc?.id ? getBalancesByLocation(loc.id).catch(() => []) : [],
  );
  const [stock, _location, allBalances] = await Promise.all([
    getStock(id),
    locationPromise,
    balancesPromise,
  ]);
  if (!stock) notFound();

  const variantIds = new Set(stock.variants.map((v) => v.id));
  const balances: Record<
    string,
    { quantityOnHand: number; averageCost: number | null }
  > = {};
  for (const b of allBalances) {
    if (variantIds.has(b.stockVariantId)) {
      balances[b.stockVariantId] = {
        quantityOnHand: b.quantityOnHand,
        averageCost: b.averageCost,
      };
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Items", href: "/stock-variants" },
          { title: stock.name, href: `/stock-variants/${id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit Stock Item"
        subtitle="Update stock details and variants."
      />
      <PageBody>
        <StockForm item={stock} balances={balances} />
      </PageBody>
    </PageShell>
  );
}
