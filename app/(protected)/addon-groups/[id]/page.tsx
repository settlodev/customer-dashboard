import { notFound } from "next/navigation";
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
import { getAddonGroup } from "@/lib/actions/addon-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import type { AddonGroup } from "@/types/product/type";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const isNewItem = id === "new";

  let group: AddonGroup | null = null;
  if (!isNewItem) {
    group = await getAddonGroup(id);
    if (!group) notFound();
  }

  const products = await fetchAllProducts().catch(() => [] as any[]);
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
      <PageBreadcrumbs
        items={[
          { title: "Addon groups", href: "/addon-groups" },
          { title: isNewItem ? "New" : group?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Add addon group" : "Edit addon group"}
        subtitle={
          isNewItem
            ? "Create a new group of optional add-ons."
            : "Update group details and manage its items."
        }
      />

      <PageBody>
        <AddonGroupForm group={group} productVariants={productVariants} />
      </PageBody>
    </PageShell>
  );
}
