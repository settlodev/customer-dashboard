import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Brand } from "@/types/brand/type";
import { getBrand } from "@/lib/actions/brand-actions";
import BrandForm from "@/components/forms/brand_form";

type Params = Promise<{ id: string }>;

export default async function BrandPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Brand | null = null;

  if (!isNewItem) {
    try {
      item = await getBrand(resolvedParams.id);
    } catch {
      notFound();
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Brands", href: "/brands" },
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Add Brand" : "Edit Brand"}
        subtitle={
          isNewItem
            ? "Create a new brand for your business"
            : "Update brand details"
        }
      />

      <PageBody>
        <BrandForm item={item} />
      </PageBody>
    </PageShell>
  );
}
