import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import AddonGroupsManager, {
  type ProductVariantOption,
} from "@/components/forms/addon_groups_manager";
import { listAddonGroups } from "@/lib/actions/addon-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";

export default async function Page() {
  const [groups, products] = await Promise.all([
    listAddonGroups().catch(() => []),
    fetchAllProducts().catch(() => [] as any[]),
  ]);

  const productVariants: ProductVariantOption[] = [];
  for (const product of products ?? []) {
    for (const v of product.variants ?? []) {
      if (v.archivedAt) continue;
      productVariants.push({
        id: v.id,
        label: `${product.name} — ${v.name}`,
      });
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Addon groups" }]} />
      <PageHeader
        title="Addon groups"
        subtitle="Optional add-ons offered alongside products."
      />

      <PageBody>
        <AddonGroupsManager
          initialGroups={groups}
          productVariants={productVariants}
        />
      </PageBody>
    </PageShell>
  );
}
