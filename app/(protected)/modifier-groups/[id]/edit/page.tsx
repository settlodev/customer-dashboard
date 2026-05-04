import { notFound } from "next/navigation";
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
import { getModifierGroup } from "@/lib/actions/modifier-actions";
import { getStocks } from "@/lib/actions/stock-actions";
import type { ModifierGroup } from "@/types/product/type";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;

  let group: ModifierGroup | null = null;
  group = await getModifierGroup(id);
  if (!group) notFound();

  const stocks = await getStocks().catch(() => [] as any[]);
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
      <PageBreadcrumbs
        items={[
          { title: "Modifier groups", href: "/modifier-groups" },
          { title: group.name, href: `/modifier-groups/${group.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${group.name}`}
        subtitle="Update group details and manage its options."
      />

      <PageBody>
        <ModifierGroupForm group={group} stockVariants={stockVariants} />
      </PageBody>
    </PageShell>
  );
}
