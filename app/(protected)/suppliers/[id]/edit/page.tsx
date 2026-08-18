import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getSupplier } from "@/lib/actions/supplier-actions";
import SupplierForm from "@/components/forms/supplier-form";

type Params = Promise<{ id: string }>;

export default async function EditSupplierPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const item = await getSupplier(id);
  if (!item) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Suppliers", href: "/suppliers" },
          { title: item.name, href: `/suppliers/${item.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit supplier"
        subtitle="Update commercial details, contact person, or marketplace link."
      />

      <PageBody>
        <SupplierForm item={item} />
      </PageBody>
    </PageShell>
  );
}
