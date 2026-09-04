import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import { getProforma } from "@/lib/actions/invoicing-proforma-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildProformaDocument } from "@/lib/invoicing-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for a proforma — the same document the
 * customer link (/proforma/[token]) renders. A live quote takes the current
 * letterhead; a converted proforma prints the issuer block frozen on it at
 * conversion, so the PDF matches what the customer accepted.
 */
export default async function ProformaPrintPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [proforma, letterhead] = await Promise.all([
    getProforma(id),
    getLetterhead(),
  ]);
  if (!proforma) notFound();

  const { data, theme } = buildProformaDocument(proforma, letterhead);

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={`${proforma.proformaNumber} - Proforma Invoice`}
      autoPrint
    />
  );
}
