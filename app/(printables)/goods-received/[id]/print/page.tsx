import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import { getGrn } from "@/lib/actions/grn-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildGrnDocument } from "@/lib/grn-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for a GRN — the same document the
 * public share link renders (shared mapper in lib/grn-document.ts), but
 * sourced from the tenant-scoped GRN endpoint so no share token needs to
 * exist. Opened in a new tab by the "Download PDF" button on the detail
 * page; the print dialog opens automatically once assets have loaded.
 */
export default async function GrnPrintPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [grn, letterhead] = await Promise.all([getGrn(id), getLetterhead()]);
  if (!grn) notFound();

  const { data, theme } = buildGrnDocument(grn, letterhead);

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      // Suggested PDF filename — number the file after the GRN itself
      // (the share page keeps the location-branded title for public tabs).
      documentTitle={`${grn.grnNumber} - Goods Received Note`}
      autoPrint
    />
  );
}
