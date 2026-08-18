import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import { getStockTransfer } from "@/lib/actions/stock-transfer-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildTransferDeliveryNote } from "@/lib/transfer-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for a stock transfer's delivery note —
 * the same document the public share link renders (shared mapper in
 * lib/transfer-document.ts), but sourced from the tenant-scoped transfer
 * endpoint so no share token needs to exist. Opened in a new tab by the
 * "Delivery Note" button on the detail page; the print dialog opens
 * automatically once assets have loaded.
 */
export default async function StockTransferPrintPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  if (id === "new") notFound();

  const [transfer, letterhead] = await Promise.all([
    getStockTransfer(id),
    getLetterhead(),
  ]);
  if (!transfer) notFound();

  const { data, theme } = buildTransferDeliveryNote(transfer, letterhead);

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      // Suggested PDF filename — number the file after the transfer itself
      // (the share page keeps the location-branded title for public tabs).
      documentTitle={`${transfer.transferNumber} - Delivery Note`}
      autoPrint
    />
  );
}
