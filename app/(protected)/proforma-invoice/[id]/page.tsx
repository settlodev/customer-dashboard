import { notFound } from "next/navigation";
import { UUID } from "node:crypto";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
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

  const recordTitle = isNewItem ? "New" : (item?.proformaNumber ?? "Edit");

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Proforma Invoices", href: "/proforma-invoice" },
          { title: recordTitle },
        ]}
      />
      <PageHeader
        title={
          isNewItem ? "Create Proforma Invoice" : "Edit Proforma Invoice"
        }
        subtitle={
          isNewItem
            ? "Generate a proforma invoice for a customer"
            : `Editing invoice ${item?.proformaNumber ?? ""}`
        }
      />
      <PageBody>
        <ProformaInvoiceCard isNewItem={isNewItem} item={item} />
      </PageBody>
    </PageShell>
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
