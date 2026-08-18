import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import { getPublicGrn } from "@/lib/actions/grn-actions";
import { buildGrnDocument, buildGrnPageTitle } from "@/lib/grn-document";

type Params = Promise<{ token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const grn = await getPublicGrn(token);
  if (!grn) return { title: "Goods Received Note · Settlo" };

  const brand = grn.letterhead?.brand ?? null;
  const letterhead = grn.letterhead?.letterhead ?? null;
  const title =
    brand?.seoTitle?.trim() || buildGrnPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Goods received note ${grn.grnNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
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

export default async function SharedGrnPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const grn = await getPublicGrn(token);
  if (!grn) notFound();

  const { data, theme, documentTitle } = buildGrnDocument(grn, grn.letterhead);

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={documentTitle}
    />
  );
}
