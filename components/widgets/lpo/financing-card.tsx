import { AlertTriangle, Ban, Check, Wallet, XCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/widgets/money";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  FINANCING_STATUS_LABELS,
  type Lpo,
  type OrderFinancingStatus,
  type SupplierAcknowledgement,
} from "@/types/lpo/type";
import type { ApplicationStatus } from "@/types/loans/applications";

/** Badge tone per financing state — shared with the LPO list table so the
 *  detail card and the list badge read as the same signal. */
export const FINANCING_BADGE_VARIANT: Record<
  OrderFinancingStatus,
  BadgeProps["variant"]
> = {
  NONE: "soft",
  REQUESTED: "warn",
  OFFER_MADE: "warn",
  DECLINED: "neg",
  PAID: "pos",
};

type StageState = "done" | "now" | "todo";

const STAGES: { title: string; detail: string }[] = [
  {
    title: "Supplier accepted",
    detail: "The supplier confirmed this order — financing can begin.",
  },
  {
    title: "Terms accepted",
    detail: "You agreed to the Settlo supplier financing terms.",
  },
  {
    title: "Offer accepted",
    detail: "You accepted the financing offer for this order.",
  },
  {
    title: "Supplier paid",
    detail: "Settlo pays the supplier on your behalf.",
  },
];

/**
 * Financing status/timeline card for the LPO detail page. Renders nothing
 * for a DIRECT (non-financed) LPO — mount unconditionally, the component
 * self-gates.
 */
export function FinancingCard({
  lpo,
  termsAcceptedAt = null,
  applicationStatus = null,
}: {
  lpo: Lpo;
  /** Account-level financing-terms acceptance timestamp (null = not accepted / unknown). */
  termsAcceptedAt?: string | null;
  /** Borrower-read status of the backing loan application, when readable. */
  applicationStatus?: ApplicationStatus | null;
}) {
  if (lpo.paymentMethod !== "SETTLO_FINANCING") return null;

  const currency = lpo.currency || lpo.items[0]?.currency || DEFAULT_CURRENCY;
  const total = lpo.items.reduce(
    (sum, item) =>
      sum + Number(item.orderedQuantity || 0) * Number(item.unitCost || 0),
    0,
  );
  // Null financedAmount on a SETTLO_FINANCING LPO means full financing — the
  // wire deliberately omits it, so the LPO total is the figure to render.
  const financedAmount = lpo.financedAmount ?? total;
  const merchantPayable = lpo.merchantPayableAmount ?? 0;
  const financingStatus: OrderFinancingStatus = lpo.financingStatus ?? "NONE";

  const cancelled = lpo.status === "CANCELLED";
  // Cancellation never resets financingStatus (verified against the
  // Inventory Service source: `resolveFinancingStatus` reads only the
  // shadow order's own field, and `cancelInternal` never touches it) — so a
  // cancelled LPO can still carry financingStatus PAID if Settlo had already
  // disbursed before the order was called off. That combination needs its
  // own truthful rendering: the money moved, so the split stays visible and
  // the badge/panel say so, instead of the blanket "did not proceed" that's
  // correct for every other cancelled case.
  const cancelledAfterPaid = cancelled && financingStatus === "PAID";
  const declined = !cancelled && financingStatus === "DECLINED";
  // Once cancelled-without-payment or declined, financing categorically did
  // not proceed — the whole order reverts to being payable to the supplier
  // directly. `financedAmount`/`merchantPayableAmount` still reflect what
  // was originally requested, not that outcome, so the split is suppressed
  // rather than shown alongside a terminal message it would contradict.
  const showSplit = cancelledAfterPaid || (!cancelled && !declined);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gray-500" />
              Settlo financing
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This order is settled through Settlo&apos;s pay-via-Settlo
              financing.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {cancelledAfterPaid ? (
              <>
                <Badge variant="pos">Paid by Settlo</Badge>
                <Badge variant="warn">Cancelled</Badge>
              </>
            ) : (
              <Badge
                variant={
                  cancelled ? "neg" : FINANCING_BADGE_VARIANT[financingStatus]
                }
              >
                {cancelled
                  ? "Cancelled"
                  : FINANCING_STATUS_LABELS[financingStatus]}
              </Badge>
            )}
          </div>
        </div>

        {showSplit && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SplitRow
              label="Settlo finances"
              amount={financedAmount}
              currency={currency}
            />
            {merchantPayable > 0 && (
              <SplitRow
                label="You pay directly"
                amount={merchantPayable}
                currency={currency}
              />
            )}
          </div>
        )}

        {cancelledAfterPaid ? (
          <CancelledAfterPaidPanel
            amount={financedAmount}
            currency={currency}
          />
        ) : cancelled ? (
          <CancelledPanel ack={lpo.supplierAcknowledgement} />
        ) : declined ? (
          <DeclinedPanel />
        ) : (
          <FinancingTimeline
            ack={lpo.supplierAcknowledgement}
            financingStatus={financingStatus}
            termsAcceptedAt={termsAcceptedAt}
            applicationStatus={applicationStatus}
          />
        )}
        {/*
         * No "Review offer in Loans" link here anymore (previously shown for
         * REQUESTED/OFFER_MADE). This card only ever renders for
         * paymentMethod === SETTLO_FINANCING — exactly the post-acceptance
         * journey the FinancingBanner above now owns end-to-end (terms →
         * phone → offer, with the accept-gate handling this component's
         * `offer-panel.tsx` never had). Linking out to
         * /loans/applications/{id} routed a supplier-payee merchant to a
         * surface that raw-409'd on the gate codes with no way to finish —
         * a second, ungated, un-completable accept surface duplicating the
         * banner's own CTA.
         */}
      </CardContent>
    </Card>
  );
}

function SplitRow({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas/60 px-3.5 py-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        <Money amount={amount} currency={currency} />
      </p>
    </div>
  );
}

// No decline-reason field is rendered here: neither `LpoResponse` nor the
// shadow `SupplierOrder` carries one on the wire today (verified against the
// Inventory Service source) — a create-time no-mint and a later LMS gate
// decline both collapse to the same bare `DECLINED` value. Add a reason line
// here if/when the backend starts exposing one.
function DeclinedPanel() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-700">
      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>Financing was declined — you can pay this order directly.</span>
    </div>
  );
}

function CancelledPanel({ ack }: { ack: SupplierAcknowledgement }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-line-2 bg-canvas px-3.5 py-3 text-xs text-ink-3">
      <Ban className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      <span>
        {ack === "REJECTED"
          ? "The supplier declined this order, so financing did not proceed."
          : "This purchase order was cancelled, so financing did not proceed."}
      </span>
    </div>
  );
}

/** Cancelled *after* Settlo had already disbursed — the one cancelled state
 *  where money actually moved, so the copy (and the split above) says so
 *  instead of the standard "did not proceed" line. */
function CancelledAfterPaidPanel({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        This order was cancelled after Settlo paid the supplier{" "}
        <Money amount={amount} currency={currency} className="font-semibold" />{" "}
        — contact support about recovery.
      </span>
    </div>
  );
}

function FinancingTimeline({
  ack,
  financingStatus,
  termsAcceptedAt,
  applicationStatus,
}: {
  ack: SupplierAcknowledgement;
  financingStatus: OrderFinancingStatus;
  termsAcceptedAt: string | null;
  applicationStatus: ApplicationStatus | null;
}) {
  // Current stage index into STAGES (design's four post-acceptance steps).
  // Supplier acceptance gates everything, so it's checked first (only
  // grandfathered create-time-financed LPOs can render this timeline while
  // still PENDING). Between offer-accept and PAID the payout is settling —
  // "Supplier paid" carries the "Now" pill (index 3). Terms acceptance is
  // an account-level fact; when it's unknown/null on a grandfathered
  // OFFER_MADE row, financingStatus alone advances the index so legacy
  // rows don't appear stuck on a step that never existed for them.
  const stageIndex = (() => {
    if (ack === "PENDING") return 0;
    if (financingStatus === "PAID") return STAGES.length; // past the last — all done
    if (applicationStatus === "ACCEPTED") return 3; // settling — "Now" on Supplier paid
    if (termsAcceptedAt || financingStatus === "OFFER_MADE") return 2;
    return 1;
  })();

  return (
    <div className="rounded-lg border border-line bg-card px-3.5 py-1">
      {STAGES.map((stage, i) => {
        const state: StageState =
          i < stageIndex ? "done" : i === stageIndex ? "now" : "todo";
        const isLast = i === STAGES.length - 1;
        return (
          <div key={stage.title} className="flex gap-3 py-2.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  state === "done"
                    ? "bg-pos text-white"
                    : state === "now"
                      ? "bg-primary text-white"
                      : "border border-line-2 bg-canvas text-muted-2",
                )}
              >
                {state === "done" ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {!isLast && <span className="my-1 w-px flex-1 bg-line" />}
            </div>
            <div className="pb-0.5 pt-0.5">
              <div
                className={cn(
                  "text-[13px] font-semibold",
                  state === "todo" ? "text-muted-foreground" : "text-ink",
                )}
              >
                {stage.title}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {stage.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
