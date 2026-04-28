import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import GrnForm from "@/components/forms/grn-form";
import { getLpo } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { LpoWithSupplierName } from "@/components/widgets/grn/lpo-picker";

const breadcrumbItems = [
  { title: "Goods received", link: "/goods-received" },
  { title: "New", link: "" },
];

type Params = {
  searchParams: Promise<{ lpoId?: string }>;
};

export default async function NewGrnPage({ searchParams }: Params) {
  const { lpoId } = await searchParams;

  // Pre-link from the LPO detail page's "Receive stock" button.
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">Goods received note</h1>
        <p className="text-sm text-muted-foreground">
          Record a delivery from a supplier.
        </p>
      </div>
      <GrnForm initialLpo={initialLpo} />
    </div>
  );
}
