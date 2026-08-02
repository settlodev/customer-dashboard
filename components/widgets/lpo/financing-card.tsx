import Link from "next/link";
import { Ban, Check, Wallet, XCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    title: "Awaiting supplier acceptance",
    detail: "The supplier must accept the order before financing begins.",
  },
  {
    title: "Underwriting",
    detail: "Settlo is reviewing the financing request.",
  },
  {
    title: "Offer ready",
    detail: "Review and accept the loan terms on the Loans page.",
  },
  {
    title: "Paid",
    detail: "Settlo has paid the supplier on your behalf.",
  },
];

/**
 * Financing status/timeline card for the LPO detail page. Renders nothing
 * for a DIRECT (non-financed) LPO — mount unconditionally, the component
 * self-gates.
 */
export function FinancingCard({ lpo }: { lpo: Lpo }) {
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
  const loanApplicationId = lpo.loanApplicationId;

  const cancelled = lpo.status === "CANCELLED";
  const declined = !cancelled && financingStatus === "DECLINED";
  // Once cancelled or declined, financing categorically did not proceed —
  // the whole order reverts to being payable to the supplier directly.
  // `financedAmount`/`merchantPayableAmount` still reflect what was
  // originally requested, not that outcome, so the split is suppressed
  // below rather than shown alongside a terminal message it would
  // contradict. Same reasoning for the header badge: a stale in-progress
  // label (e.g. "Underwriting") would read oddly next to "Cancelled".

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
          <Badge
            variant={
              cancelled ? "neg" : FINANCING_BADGE_VARIANT[financingStatus]
            }
          >
            {cancelled ? "Cancelled" : FINANCING_STATUS_LABELS[financingStatus]}
          </Badge>
        </div>

        {cancelled ? (
          <CancelledPanel ack={lpo.supplierAcknowledgement} />
        ) : declined ? (
          <DeclinedPanel />
        ) : (
          <>
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

            <FinancingTimeline
              ack={lpo.supplierAcknowledgement}
              financingStatus={financingStatus}
            />
          </>
        )}

        {loanApplicationId &&
          (financingStatus === "REQUESTED" ||
            financingStatus === "OFFER_MADE") && (
            <Button
              asChild
              size="sm"
              variant={financingStatus === "OFFER_MADE" ? "default" : "outline"}
            >
              <Link href={`/loans/applications/${loanApplicationId}`}>
                Review offer in Loans
              </Link>
            </Button>
          )}
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

function FinancingTimeline({
  ack,
  financingStatus,
}: {
  ack: SupplierAcknowledgement;
  financingStatus: OrderFinancingStatus;
}) {
  // Current stage index into STAGES. Supplier acceptance gates everything
  // else, so it's checked first. The backend resolves financingStatus
  // synchronously in the same transaction as acceptance (REQUESTED, or
  // DECLINED if the mint didn't happen) — by the time `ack` is ACCEPTED and
  // we're rendering the timeline (DECLINED/CANCELLED are handled by the
  // caller before this component is reached), financingStatus can only be
  // REQUESTED, OFFER_MADE, or PAID.
  const stageIndex = (() => {
    if (ack === "PENDING") return 0;
    if (financingStatus === "OFFER_MADE") return 2;
    if (financingStatus === "PAID") return STAGES.length; // past the last — all done
    return 1; // REQUESTED
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
