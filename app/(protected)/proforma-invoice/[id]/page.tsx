import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProformaInvoiceForm from "@/components/forms/proforma-invoice-form";
import { Proforma } from "@/types/proforma/type";
import { getProforma } from "@/lib/actions/proforma-actions";

type Params = Promise<{ id: string }>;

export default async function ProformaInvoicePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const isNewItem = id === "new";

  const item = isNewItem ? null : await fetchProforma(id as UUID);

  const breadcrumbItems = [
    { title: "Proforma Invoices", link: "/proforma-invoice" },
    {
      title: isNewItem ? "New" : (item?.proformaNumber ?? "Edit"),
      link: "",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </div>
      <ProformaInvoiceCard isNewItem={isNewItem} item={item} />
    </div>
  );
}

async function fetchProforma(id: UUID): Promise<Proforma> {
  try {
    const proforma = await getProforma(id);
    if (!proforma) notFound();
    return proforma;
  } catch (error) {
    if ((error as { digest?: string })?.digest === "NEXT_NOT_FOUND")
      throw error;
    console.error("[ProformaInvoicePage] Failed to fetch proforma:", error);
    throw new Error("Failed to load proforma invoice. Please try again.");
  }
}

function ProformaInvoiceCard({
  isNewItem,
  item,
}: {
  isNewItem: boolean;
  item: Proforma | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isNewItem ? "Create Proforma Invoice" : "Edit Proforma Invoice"}
        </CardTitle>
        <CardDescription>
          {isNewItem
            ? "Generate a proforma invoice for a customer"
            : `Editing invoice ${item?.proformaNumber ?? ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProformaInvoiceForm item={item} />
      </CardContent>
    </Card>
  );
}
