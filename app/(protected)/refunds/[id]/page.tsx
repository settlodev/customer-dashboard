import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { StatusPill } from "@/components/layouts/order-detail";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getRefundRecord } from "@/lib/actions/refund-actions";
import { isBoundaryError } from "@/lib/list-fallback";
import {
  fmtQuantity,
  refundReasonLabel,
  refundReasonTone,
} from "@/types/reports/refunds";
import { RefundDetailView } from "./refund-detail-view";

type Params = Promise<{ id: string }>;

export default async function RefundPage({ params }: { params: Params }) {
  const { id } = await params;

  // The Reports Service 404s an unknown id; anything else (auth, outage) has
  // to keep its own handling — a session-expired error must reach the route
  // boundary, not be flattened into "not found".
  let refund;
  try {
    refund = await getRefundRecord(id);
  } catch (error) {
    if (isBoundaryError(error)) throw error;
    notFound();
  }
  if (!refund) notFound();

  const currency = await getLocationCurrency().catch(() => "TZS");

  const subtitleParts = [
    refund.orderItemName ?? "Refunded item",
    `${fmtQuantity(refund.quantity)} unit${refund.quantity === 1 ? "" : "s"}`,
  ];
  if (refund.orderNumber) subtitleParts.push(`Order #${refund.orderNumber}`);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Refunds", href: "/refunds" },
          {
            title: refund.orderNumber
              ? `#${refund.orderNumber}`
              : (refund.orderItemName ?? "Refund"),
          },
        ]}
      />
      <PageHeader
        title="Refund"
        titleAccessory={
          <StatusPill tone={refundReasonTone(refund.reasonType)} dot>
            {refund.reasonType ? refundReasonLabel(refund.reasonType) : "Refund"}
          </StatusPill>
        }
        subtitle={subtitleParts.join(" · ")}
      />

      <PageBody>
        <RefundDetailView refund={refund} currency={currency} />
      </PageBody>
    </PageShell>
  );
}
