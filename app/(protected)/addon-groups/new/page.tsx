import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  AddonGroupForm,
  type ProductVariantOption,
} from "@/components/forms/addon_group_form";
import { fetchAllProducts } from "@/lib/actions/product-actions";

export default async function NewAddonGroupPage() {
  const products = await fetchAllProducts().catch(() => [] as any[]);
  const productVariants: ProductVariantOption[] = [];
  for (const product of products ?? []) {
    for (const v of product.variants ?? []) {
      if (v.archivedAt) continue;
      productVariants.push({
        id: v.id,
        label: `${product.name} — ${v.name}`,
        price: v.price ?? null,
        costPrice: v.costPrice ?? null,
      });
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Addon groups", href: "/addon-groups" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add addon group"
        subtitle="Create a new group of optional add-ons."
      />
      <PageBody>
        <AddonGroupForm group={null} productVariants={productVariants} />
      </PageBody>
    </PageShell>
  );
}
