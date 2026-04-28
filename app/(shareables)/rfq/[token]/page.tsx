import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicRfq } from "@/lib/actions/rfq-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import type { RfqStatus } from "@/types/rfq/type";
import type { LetterheadBlock } from "@/types/letterhead/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const STATUS_BADGE: Record<
  RfqStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  QUOTES_RECEIVED: { label: "Quotes Received", tone: "info" },
  EVALUATED: { label: "Evaluated", tone: "warning" },
  AWARDED: { label: "Awarded", tone: "success" },
  CONVERTED_TO_LPO: { label: "Converted to LPO", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Request for Quotation`;
};

const composeAddress = (
  letterhead: LetterheadBlock | null | undefined,
): string[] => {
  if (!letterhead) return [];
  const lines: string[] = [];
  if (letterhead.addressLine) lines.push(letterhead.addressLine);
  if (letterhead.postalCode) lines.push(`P.O.Box ${letterhead.postalCode}`);
  const locality = [letterhead.ward, letterhead.district].filter(Boolean).join(", ");
  if (locality) lines.push(locality);
  if (letterhead.region) lines.push(letterhead.region);
  if (letterhead.countryName) lines.push(letterhead.countryName);
  return lines;
};

const formatSignatureDate = (
  iso: string | null | undefined,
): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const rfq = await getPublicRfq(token);
  if (!rfq) return { title: "Request for Quotation · Settlo" };

  const brand = rfq.letterhead?.brand ?? null;
  const letterhead = rfq.letterhead?.letterhead ?? null;
  const title = brand?.seoTitle?.trim() || buildPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Request for quotation ${rfq.rfqNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
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

export default async function SharedRfqPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const rfq = await getPublicRfq(token);
  if (!rfq) notFound();

  const letterhead = rfq.letterhead?.letterhead ?? null;
  const taxIds = rfq.letterhead?.taxIds ?? null;
  const brand = rfq.letterhead?.brand ?? null;
  const currency = rfq.targetCurrency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
  const documentTitle = buildPageTitle(letterhead?.locationName);

  const issuer: BusinessIdentity = {
    name: letterhead?.businessName ?? "Business",
    logoUrl: letterhead?.logoUrl ?? undefined,
    addressLines: composeAddress(letterhead),
    phone: letterhead?.phone ?? undefined,
    email: letterhead?.email ?? undefined,
    website: letterhead?.website ?? undefined,
    tin: taxIds?.tin ?? undefined,
    vrn: taxIds?.vrn ?? undefined,
  };

  const recipient: Party = {
    name: "Suppliers",
    addressLines: [],
  };

  const items: LineItem[] = rfq.items.map((item) => ({
    name: item.stockVariantDisplayName || "—",
    description: item.notes?.trim() || undefined,
    quantity: Number(item.requestedQuantity || 0),
    unitPrice: Number(item.estimatedUnitCost ?? 0),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const noteParts: string[] = [];
  noteParts.push(`Title: ${rfq.title}`);
  if (rfq.submissionDeadline) {
    noteParts.push(
      `Submission deadline: ${formatSignatureDate(rfq.submissionDeadline) ?? rfq.submissionDeadline}`,
    );
  }
  if (rfq.requiredByDate) {
    noteParts.push(
      `Required by: ${formatSignatureDate(rfq.requiredByDate) ?? rfq.requiredByDate}`,
    );
  }
  if (rfq.notes?.trim()) noteParts.push(rfq.notes.trim());

  const data: BusinessDocumentData = {
    meta: {
      type: "request_for_quotation",
      documentNumber: rfq.rfqNumber,
      issueDate: rfq.createdAt,
      dueDate: rfq.submissionDeadline ?? undefined,
      status: STATUS_BADGE[rfq.status],
    },
    issuer,
    recipient,
    items,
    totals: {
      subtotal,
      total: subtotal,
      amountDue: subtotal,
    },
    currency,
    notes: noteParts.join("\n\n"),
    signatures: [
      {
        label: "Issued by",
        date: formatSignatureDate(rfq.createdAt),
      },
    ],
    footerMessage: "",
  };

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={documentTitle}
    />
  );
}
