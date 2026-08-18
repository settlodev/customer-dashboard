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

  let group: AddonGroup | null = null;
  group = await getAddonGroup(id);
  if (!group) notFound();

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
          { title: group.name, href: `/addon-groups/${group.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${group.name}`}
        subtitle="Update group details and manage its items."
      />

      <PageBody>
        <AddonGroupForm group={group} productVariants={productVariants} />
      </PageBody>
    </PageShell>
  );
}
