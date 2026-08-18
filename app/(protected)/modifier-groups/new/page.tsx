import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  ModifierGroupForm,
  type StockVariantOption,
} from "@/components/forms/modifier_group_form";
import { getStocks } from "@/lib/actions/stock-actions";

export default async function NewModifierGroupPage() {
  const stocks = await getStocks().catch(() => [] as any[]);
  const stockVariants: StockVariantOption[] = [];
  for (const stock of stocks ?? []) {
    for (const v of stock.variants ?? []) {
      if (v.archived) continue;
      stockVariants.push({
        id: v.id,
        label: `${stock.name} — ${v.name}`,
        unitId: v.unitId,
      });
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Modifier groups", href: "/modifier-groups" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add modifier group"
        subtitle="Create a new reusable group of customer-facing tweaks."
      />
      <PageBody>
        <ModifierGroupForm group={null} stockVariants={stockVariants} />
      </PageBody>
    </PageShell>
  );
}
