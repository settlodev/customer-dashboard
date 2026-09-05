import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents/PrintableDocument";
import { PlStatementSheet } from "@/components/reports/profit-loss/pl-statement-sheet";
import { getPublicMonthlyProfitLoss } from "@/lib/actions/monthly-pl-share-actions";

type Params = Promise<{ token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params;
  const dto = await getPublicMonthlyProfitLoss(token);
  if (!dto) return { title: "Profit & Loss · Settlo" };
  const business = dto.letterhead?.businessName ?? "Settlo";
  return {
    title: `Profit & Loss · ${dto.periodLabel} · ${business}`,
    description: `Profit & loss statement for ${dto.letterhead?.locationName ?? business}, ${dto.periodLabel}.`,
  };
}

/**
 * Public, unauthenticated month-end P&L — the link in the monthly
 * statement email. Mirrors `/cod/[token]`: one plain lookup by opaque
 * token, the frozen payload rendered inside the shared printable frame.
 */
export default async function SharedMonthlyProfitLossPage({ params }: { params: Params }) {
  const { token } = await params;
  const dto = await getPublicMonthlyProfitLoss(token);
  if (!dto) notFound();

  const documentTitle = `Profit & Loss — ${dto.periodLabel}${
    dto.letterhead?.locationName ? ` — ${dto.letterhead.locationName}` : ""
  }`;

  return (
    <PrintableDocument documentTitle={documentTitle}>
      <PlStatementSheet report={dto} />
    </PrintableDocument>
  );
}
