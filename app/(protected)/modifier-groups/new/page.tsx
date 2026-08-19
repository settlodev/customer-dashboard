import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { itemDisplayName } from "@/lib/display-name";
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
        label: itemDisplayName({
          parentName: stock.name,
          variantName: v.name,
          displayName: v.displayName,
          collapseDefault: (stock.variants ?? []).length === 1,
        }),
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
