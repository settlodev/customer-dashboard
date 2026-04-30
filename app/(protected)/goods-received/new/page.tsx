import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import GrnForm from "@/components/forms/grn-form";
import { getLpo } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { LpoWithSupplierName } from "@/components/widgets/grn/lpo-picker";

type Params = {
  searchParams: Promise<{ lpoId?: string }>;
};

export default async function NewGrnPage({ searchParams }: Params) {
  const { lpoId } = await searchParams;

  let initialLpo: LpoWithSupplierName | null = null;
  if (lpoId) {
    const [lpo, suppliers] = await Promise.all([
      getLpo(lpoId),
      fetchAllSuppliers(),
    ]);
    if (lpo) {
      const supplierName =
        suppliers.find((s) => s.id === lpo.supplierId)?.name ?? null;
      initialLpo = { ...lpo, supplierName };
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Goods received", href: "/goods-received" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Goods Received Note"
        subtitle="Record a delivery from a supplier."
      />
      <PageBody>
        <GrnForm initialLpo={initialLpo} />
      </PageBody>
    </PageShell>
  );
}
