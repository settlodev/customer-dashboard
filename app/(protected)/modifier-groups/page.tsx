import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import ModifierGroupsManager, {
  type StockVariantOption,
} from "@/components/forms/modifier_groups_manager";
import { listModifierGroups } from "@/lib/actions/modifier-actions";
import { getStocks } from "@/lib/actions/stock-actions";

export default async function Page() {
  const [groups, stocks] = await Promise.all([
    listModifierGroups().catch(() => []),
    getStocks().catch(() => [] as any[]),
  ]);

  const stockVariants: StockVariantOption[] = [];
  for (const stock of stocks ?? []) {
    for (const v of stock.variants ?? []) {
      if (v.archived) continue;
      stockVariants.push({
        id: v.id,
        label: `${stock.name} — ${v.name}`,
      });
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Modifier groups" }]} />
      <PageHeader
        title="Modifier groups"
        subtitle="Variants like sizes, additions, or notes attached to products."
      />

      <PageBody>
        <ModifierGroupsManager
          initialGroups={groups}
          stockVariants={stockVariants}
        />
      </PageBody>
    </PageShell>
  );
}
