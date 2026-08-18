import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import type { Staff } from "@/types/staff";
import { getPublicCloseOfDay } from "@/lib/actions/day-session-share-actions";
import { resolveCurrency } from "@/lib/day-sessions/cod-format";
import { PrintableDocument } from "@/components/documents/PrintableDocument";
import { CloseOfDayReportSheet } from "@/components/widgets/day-sessions/close-of-day-report-sheet";

type Params = Promise<{ token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const dto = await getPublicCloseOfDay(token);
  if (!dto) return { title: "Close of Day Report · Settlo" };

  const brand = dto.letterhead?.brand ?? null;
  const lh = dto.letterhead?.letterhead ?? null;
  const business = lh?.businessName ?? "Settlo";
  const title = brand?.seoTitle?.trim() || `Close of Day Report · ${business}`;
  const description =
    brand?.seoDescription?.trim() ||
    `Close of day report for ${lh?.locationName ?? business} — business day ${dto.session.businessDate}.`;
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

/**
 * Public, unauthenticated Close-of-Day report — the shareable link an
 * owner or accountant can open without logging in. Mirrors the GRN
 * `/grn/[token]` share page: one plain lookup by opaque token whose
 * payload embeds the letterhead + referenced staff, rendered by the same
 * `CloseOfDayReportSheet` the authenticated print route uses.
 */
export default async function SharedCloseOfDayPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const dto = await getPublicCloseOfDay(token);
  if (!dto) notFound();

  // The backend 404s expired tokens, but if a stale-but-present payload
  // slips through, fail closed with a friendly notice rather than the
  // financials.
  if (dto.expiresAt && new Date(dto.expiresAt).getTime() < Date.now()) {
    return <ExpiredNotice />;
  }

  const roster = new Map(dto.staff.map((s): [string, Staff] => [s.id, s]));
  const currency =
    dto.currency ??
    resolveCurrency(
      dto.reconciliations.find((r) => r.currency)?.currency,
      dto.expenses?.items[0]?.currencyCode,
      dto.prepayments?.items[0]?.currency,
      dto.refunds?.refunds[0]?.refundCurrency,
    );

  const documentTitle = `${dto.session.identifier ?? "Close of Day"} — Close of Day Report`;

  return (
    <PrintableDocument documentTitle={documentTitle}>
      <CloseOfDayReportSheet
        session={dto.session}
        report={dto.report}
        reconciliations={dto.reconciliations}
        extras={{
          prepayments: dto.prepayments,
          refunds: dto.refunds,
          voids: dto.voids,
          expenses: dto.expenses,
        }}
        letterhead={dto.letterhead}
        roster={roster}
        currency={currency}
        generatedAt={new Date().toISOString()}
      />
    </PrintableDocument>
  );
}

function ExpiredNotice() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-stone-500">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-stone-900">
          This share link has expired
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Ask the sender to generate a new Close of Day report link.
        </p>
      </div>
    </div>
  );
}
