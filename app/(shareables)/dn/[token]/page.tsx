import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import { getPublicStockTransfer } from "@/lib/actions/stock-transfer-actions";
import {
  buildTransferDeliveryNote,
  buildTransferNotePageTitle,
} from "@/lib/transfer-document";

type Params = Promise<{ token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const transfer = await getPublicStockTransfer(token);
  if (!transfer) return { title: "Delivery Note · Settlo" };

  const brand = transfer.letterhead?.brand ?? null;
  const letterhead = transfer.letterhead?.letterhead ?? null;
  const title =
    brand?.seoTitle?.trim() ||
    buildTransferNotePageTitle(
      letterhead?.locationName ?? transfer.sourceLocationName,
    );
  const description =
    brand?.seoDescription?.trim() ||
    `Delivery note ${transfer.transferNumber} from ${
      letterhead?.businessName ?? transfer.sourceLocationName ?? "Settlo"
    }.`;
  const ogImage =
    brand?.shareImageUrl ?? brand?.logoWideUrl ?? brand?.logoSquareUrl ?? undefined;

  return {
    title,
    description,
    icons: brand?.faviconUrl ? { icon: brand.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SharedDeliveryNotePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const transfer = await getPublicStockTransfer(token);
  if (!transfer) notFound();

  const { data, theme, documentTitle } = buildTransferDeliveryNote(
    transfer,
    transfer.letterhead,
  );

  return (
    <PrintableDocument data={data} theme={theme} documentTitle={documentTitle} />
  );
}
