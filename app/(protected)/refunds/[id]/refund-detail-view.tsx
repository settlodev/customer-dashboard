import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Coins,
  CreditCard,
  Hash,
  Info,
  Package,
  Receipt,
  ShieldCheck,
  StickyNote,
  Undo2,
  User,
} from "lucide-react";

import {
  fact,
  FactGrid,
  HeroCard,
  HeroChip,
  HeroLabel,
  HeroMeter,
  HeroValue,
  HERO_TONE_HEX,
  PanelCard,
  RailCard,
  StatusPill,
  VList,
  VRow,
  type Fact,
} from "@/components/layouts/order-detail";
import {
  fmtQuantity,
  fmtRefundAmount,
  humaniseCode,
  refundReasonLabel,
  refundReasonTone,
  refundTypeLabel,
  type RefundRecord,
} from "@/types/reports/refunds";

/**
 * Refund detail — the sales-order detail layout applied to a single refund:
 * a dark money hero over a left rail of facts, with the item, reason and
 * attribution panels on the right.
 *
 * <p>A refund is a much smaller record than an order, so there are no
 * drill-down tabs — everything fits on one surface, and the page stays a
 * server component (no client JS) as a result.
 */

// Explicit date/time parts — `dateStyle` + `timeStyle` together differ
// between the Node and browser ICU builds and trip hydration.
const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${DATE_FMT.format(date)}, ${TIME_FMT.format(date)}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FMT.format(date);
};

export function RefundDetailView({
  refund,
  currency,
}: {
  refund: RefundRecord;
  currency: string;
}) {
  const refunded = refund.refundNetAmount || 0;
  const costBack = refund.returnedCost;
  // What the refund actually cost: revenue goes back in full, but the COGS of
  // the returned unit comes back with it. The gap is the gross profit handed
  // over — the figure worth leading with next to the headline.
  const marginLost = costBack != null ? refunded - costBack : null;
  const recoveryPct =
    costBack != null && refunded > 0 ? (costBack / refunded) * 100 : 0;

  const unitPrice = refund.quantity > 0 ? refunded / refund.quantity : null;

  const detailFacts: Fact[] = [
    fact("Refunded at", formatDateTime(refund.refundDate), <CalendarDays className="h-3 w-3" />),
    fact("Business day", formatDate(refund.businessDate), <CalendarDays className="h-3 w-3" />),
    fact("Refund type", refund.refundType ? refundTypeLabel(refund.refundType) : null, <Undo2 className="h-3 w-3" />),
    fact(
      "Paid back via",
      refund.paymentMethodCode ? humaniseCode(refund.paymentMethodCode) : null,
      <CreditCard className="h-3 w-3" />,
    ),
    fact("Refund ID", refund.id, <Hash className="h-3 w-3" />, { mono: true }),
    fact(
      "Day session",
      refund.daySessionId,
      <Receipt className="h-3 w-3" />,
      { mono: true },
    ),
  ];

  const peopleFacts: Fact[] = [
    fact("Refunded by", refund.refundedByName, <User className="h-3 w-3" />),
    fact("Approved by", refund.approvedByName, <ShieldCheck className="h-3 w-3" />),
    fact("Original seller", refund.originalStaffName, <User className="h-3 w-3" />),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
      {/* ── Left rail ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <HeroCard>
          <div className="flex items-center justify-between gap-3">
            <HeroLabel>Refunded</HeroLabel>
            <HeroChip tone={refund.stockReturned ? "pos" : "warn"}>
              {refund.stockReturned ? "Restocked" : "Written off"}
            </HeroChip>
          </div>
          <HeroValue value={fmtRefundAmount(refunded)} unit={currency} />

          {costBack != null ? (
            <HeroMeter
              pct={recoveryPct}
              color={HERO_TONE_HEX.pos}
              left={`${fmtRefundAmount(costBack)} cost recovered`}
              right={
                marginLost != null
                  ? `${fmtRefundAmount(marginLost)} margin lost`
                  : ""
              }
            />
          ) : (
            <p className="mt-4 font-mono text-[10.5px] text-white/60">
              Cost unavailable — the original sold line couldn&apos;t be matched.
            </p>
          )}
        </HeroCard>

        <RailCard icon={<Info className="h-3.5 w-3.5" />} title="Refund">
          <VList>
            <VRow
              label="Quantity"
              value={`${fmtQuantity(refund.quantity)}${
                unitPrice != null
                  ? ` × ${fmtRefundAmount(unitPrice)} ${currency}`
                  : ""
              }`}
            />
            <VRow
              label="Refunded"
              value={`${fmtRefundAmount(refunded)} ${currency}`}
            />
            <VRow
              label="Cost back"
              value={
                costBack != null
                  ? `${fmtRefundAmount(costBack)} ${currency}`
                  : "—"
              }
            />
            <VRow
              label="Margin lost"
              value={
                marginLost != null
                  ? `${fmtRefundAmount(marginLost)} ${currency}`
                  : "—"
              }
            />
          </VList>
        </RailCard>

        <RailCard icon={<User className="h-3.5 w-3.5" />} title="People">
          <FactGrid rows={peopleFacts} cols={1} />
        </RailCard>
      </div>

      {/* ── Main column ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <PanelCard icon={<Package className="h-3.5 w-3.5" />} title="Refunded item">
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                {refund.orderItemName ?? "Unnamed item"}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-ink">
                {fmtRefundAmount(refunded)}
                <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
                  {currency}
                </span>
              </span>
            </div>
            <FactGrid
              rows={[
                fact("Quantity", fmtQuantity(refund.quantity), <Package className="h-3 w-3" />),
                fact(
                  "Unit price",
                  unitPrice != null
                    ? `${fmtRefundAmount(unitPrice)} ${currency}`
                    : null,
                  <Coins className="h-3 w-3" />,
                ),
                fact(
                  "Cost recovered",
                  costBack != null
                    ? `${fmtRefundAmount(costBack)} ${currency}`
                    : null,
                  <Coins className="h-3 w-3" />,
                ),
                {
                  label: "Stock",
                  icon: <Package className="h-3 w-3" />,
                  badge: (
                    <StatusPill tone={refund.stockReturned ? "pos" : "warn"} dot>
                      {refund.stockReturned
                        ? "Back on hand"
                        : "Not returned to stock"}
                    </StatusPill>
                  ),
                },
              ]}
              cols={2}
            />
          </div>
        </PanelCard>

        <PanelCard icon={<StickyNote className="h-3.5 w-3.5" />} title="Reason">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {refund.reasonType ? (
                <StatusPill tone={refundReasonTone(refund.reasonType)} dot>
                  {refundReasonLabel(refund.reasonType)}
                </StatusPill>
              ) : (
                <StatusPill tone="muted">No reason recorded</StatusPill>
              )}
            </div>
            {refund.reason ? (
              <p className="whitespace-pre-wrap rounded-lg border border-line bg-canvas px-3.5 py-3 text-[13px] text-ink-2">
                {refund.reason}
              </p>
            ) : (
              <p className="text-[12.5px] text-muted-foreground">
                No note was left with this refund.
              </p>
            )}
          </div>
        </PanelCard>

        <PanelCard icon={<Receipt className="h-3.5 w-3.5" />} title="Refund details">
          <FactGrid rows={detailFacts} cols={2} />
        </PanelCard>

        <PanelCard icon={<Receipt className="h-3.5 w-3.5" />} title="Original order">
          {refund.orderId ? (
            <Link
              href={`/orders/${refund.orderId}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-4 py-3.5 transition-colors hover:bg-card"
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink">
                  {refund.orderNumber
                    ? `Order #${refund.orderNumber}`
                    : "View the order"}
                </span>
                <span className="mt-0.5 block font-mono text-[10.5px] text-muted-foreground">
                  See every line, payment and refund on the sale
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-2 transition-colors group-hover:text-primary" />
            </Link>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              This refund isn&apos;t linked to an order.
            </p>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
