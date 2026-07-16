"use client";

/**
 * Cash-up & reconciliation — the Close-of-Day centrepiece.
 *
 * Merges the old "Payments" + "Reconciliation" tabs into one table per
 * the design: Method · Txns · Expected · Counted · Variance · Status ·
 * Approve. Transaction counts are joined in from the Reports X/Z-report
 * (`paymentsByMethod`) because the reconciliation rows themselves don't
 * carry a count. Approving a row (or "Approve all") calls the existing
 * `approvePaymentMethodReconciliation` action, then refreshes the
 * server data so the authoritative status/approver comes back.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Loader2, Wallet } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fmt, fmtVariance, initialsOf } from "@/lib/day-sessions/cod-format";
import { approvePaymentMethodReconciliation } from "@/lib/actions/payment-method-reconciliation-actions";
import type { PaymentMethodReconciliation } from "@/types/payment-method-reconciliation/type";

const varianceClass = (n: number) =>
  n === 0 ? "text-muted-2" : n > 0 ? "text-warn" : "text-neg";

// "incl. X tips, Y prepayment" — both already counted in expectedAmount;
// this is purely so a reader can tell them apart from ordinary sales.
function tipPrepaymentBreakdown(r: PaymentMethodReconciliation): string | null {
  const parts: string[] = [];
  if (r.expectedTip && r.expectedTip > 0) parts.push(`${fmt(r.expectedTip)} tips`);
  if (r.expectedPrepayment && r.expectedPrepayment > 0)
    parts.push(`${fmt(r.expectedPrepayment)} prepayment`);
  return parts.length > 0 ? `incl. ${parts.join(", ")}` : null;
}

export function CashUpReconciliationCard({
  reconciliations,
  sessionId,
  currency,
  txnsByMethodId,
  staffInitialsById,
}: {
  reconciliations: PaymentMethodReconciliation[];
  sessionId: string;
  currency: string;
  /** paymentMethodId → transaction count, from the Reports X/Z-report. */
  txnsByMethodId: Record<string, number>;
  /** staff id → initials, for the approver badge on approved rows. */
  staffInitialsById: Record<string, string>;
}) {
  const pending = reconciliations.filter((r) => r.status === "SUBMITTED");

  const expectedTotal = reconciliations.reduce(
    (s, r) => s + (r.expectedAmount ?? 0),
    0,
  );
  const countedTotal = reconciliations.reduce(
    (s, r) => s + (r.countedAmount ?? 0),
    0,
  );
  const varianceTotal = countedTotal - expectedTotal;
  const txnsTotal = reconciliations.reduce(
    (s, r) => s + (r.paymentMethodId ? (txnsByMethodId[r.paymentMethodId] ?? 0) : 0),
    0,
  );

  return (
    <section
      id="cashup"
      className="mb-3.5 rounded-xl border border-line bg-card p-[18px]"
    >
      <div className="mb-[15px] flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <span className="inline-flex text-primary">
            <Wallet className="h-[17px] w-[17px]" />
          </span>
          <span className="truncate">Cash-up &amp; reconciliation</span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.02em]",
              pending.length > 0
                ? "bg-warn-tint text-warn"
                : "bg-pos-tint text-pos",
            )}
          >
            <span className="h-[5px] w-[5px] rounded-full bg-current" />
            {pending.length > 0 ? `${pending.length} awaiting` : "All approved"}
          </span>
          {pending.length > 0 ? (
            <PermissionGuard permission="till_reconciliation:approve">
              <BulkApprove
                pending={pending}
                sessionId={sessionId}
                varianceTotal={varianceTotal}
              />
            </PermissionGuard>
          ) : null}
        </div>
      </div>

      {reconciliations.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          No cash-up was recorded for this session.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:border-line [&>th]:px-3 [&>th]:pb-2.5 [&>th]:text-right [&>th]:font-mono [&>th]:text-[9.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em] [&>th]:text-muted-foreground [&>th:first-child]:pl-0 [&>th:first-child]:text-left">
                  <th>Method</th>
                  <th>Txns</th>
                  <th>Expected</th>
                  <th>Counted</th>
                  <th>Variance</th>
                  <th className="!text-left">Status</th>
                  <th aria-label="Approve" />
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((r) => {
                  const variance = r.variance ?? 0;
                  const txns = r.paymentMethodId
                    ? txnsByMethodId[r.paymentMethodId]
                    : undefined;
                  const subtitle =
                    r.paymentMethodCode &&
                    r.paymentMethodCode !== r.paymentMethodName
                      ? r.paymentMethodCode
                      : (r.expectedSource ?? null);
                  const breakdown = tipPrepaymentBreakdown(r);
                  return (
                    <tr
                      key={r.id}
                      className="[&>td]:whitespace-nowrap [&>td]:border-b [&>td]:border-line [&>td]:px-3 [&>td]:py-[11px] [&>td]:text-right [&>td]:font-mono [&>td]:text-[12.5px] [&>td]:tabular-nums [&>td]:text-ink [&>td:first-child]:pl-0 [&>td:first-child]:text-left"
                    >
                      <td>
                        <div className="font-sans text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                          {r.paymentMethodName ?? r.paymentMethodCode ?? "—"}
                        </div>
                        {subtitle ? (
                          <div className="mt-0.5 font-mono text-[10.5px] font-normal text-muted-foreground">
                            {subtitle}
                          </div>
                        ) : null}
                        {breakdown ? (
                          <div className="mt-0.5 font-mono text-[10.5px] font-normal text-muted-foreground">
                            {breakdown}
                          </div>
                        ) : null}
                      </td>
                      <td>{txns != null ? fmt(txns) : "—"}</td>
                      <td>{fmt(r.expectedAmount)}</td>
                      <td>{fmt(r.countedAmount)}</td>
                      <td className={varianceClass(variance)}>
                        {fmtVariance(variance)}
                      </td>
                      <td className="!text-left">
                        <StatusChip status={r.status} />
                      </td>
                      <td>
                        {r.status === "APPROVED" ? (
                          <ApprovedMark
                            initials={
                              r.approvedBy
                                ? (staffInitialsById[r.approvedBy] ??
                                  (r.approvedByName
                                    ? initialsOf(r.approvedByName)
                                    : undefined))
                                : undefined
                            }
                          />
                        ) : r.status === "SUBMITTED" ? (
                          <PermissionGuard permission="till_reconciliation:approve">
                            <RowApprove recon={r} sessionId={sessionId} />
                          </PermissionGuard>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="[&>td]:border-t-2 [&>td]:border-line-2 [&>td]:bg-canvas [&>td]:px-3 [&>td]:py-3 [&>td]:text-right [&>td]:font-mono [&>td]:text-[12.5px] [&>td]:font-bold [&>td]:tabular-nums [&>td]:text-ink [&>td:first-child]:pl-3 [&>td:first-child]:text-left">
                  <td className="!font-mono !text-[10px] uppercase tracking-[0.06em] !text-ink-3">
                    Total · {currency}
                  </td>
                  <td>{fmt(txnsTotal)}</td>
                  <td>{fmt(expectedTotal)}</td>
                  <td>{fmt(countedTotal)}</td>
                  <td className={varianceClass(varianceTotal)}>
                    {fmtVariance(varianceTotal)}
                  </td>
                  <td colSpan={2} className="!bg-canvas" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
            Approving records the manager review. Mobile-money variances post a
            Mobile Money Over/Short entry to the ledger; cash reconciles via the
            till and card / provider methods via settlement.
          </p>
        </>
      )}
    </section>
  );
}

function StatusChip({ status }: { status: PaymentMethodReconciliation["status"] }) {
  const tone =
    status === "APPROVED"
      ? "bg-pos-tint text-pos"
      : status === "REJECTED"
        ? "bg-neg-tint text-neg"
        : "bg-warn-tint text-warn";
  const label =
    status === "APPROVED"
      ? "Approved"
      : status === "REJECTED"
        ? "Rejected"
        : "Submitted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.02em]",
        tone,
      )}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}

/** Approved-row affordance: approver initials, or a plain check. */
function ApprovedMark({ initials }: { initials?: string }) {
  return (
    <span className="inline-flex h-[30px] items-center gap-1.5 px-2 font-mono text-[12px] font-semibold text-muted-foreground">
      <Check className="h-3.5 w-3.5 text-muted-2" />
      {initials ?? ""}
    </span>
  );
}

// ── Approve actions ──────────────────────────────────────────────────

function RowApprove({
  recon,
  sessionId,
}: {
  recon: PaymentMethodReconciliation;
  sessionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const label = recon.paymentMethodName ?? recon.paymentMethodCode ?? "method";
  const variance = recon.variance ?? 0;

  const onConfirm = () => {
    startTransition(() => {
      approvePaymentMethodReconciliation(recon.id, sessionId).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't approve",
            description: res.message,
          });
          return;
        }
        toast({
          title: "Reconciliation approved",
          description: `${label} confirmed.`,
        });
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-line-2 bg-card px-[11px] text-[12px] font-semibold text-ink-2 transition-colors hover:border-pos/30 hover:bg-pos-tint"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-pos" />
        Approve
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve {label} cash-up?</DialogTitle>
            <DialogDescription>
              {variance === 0
                ? "No variance — this records your review with no ledger impact."
                : `Variance of ${fmtVariance(variance)}. For mobile money this posts a Mobile Money Over/Short entry to the ledger.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BulkApprove({
  pending,
  sessionId,
  varianceTotal,
}: {
  pending: PaymentMethodReconciliation[];
  sessionId: string;
  varianceTotal: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    startTransition(() => {
      (async () => {
        let ok = 0;
        let failed = 0;
        for (const r of pending) {
          try {
            const res = await approvePaymentMethodReconciliation(r.id, sessionId);
            if (res.responseType === "error") failed += 1;
            else ok += 1;
          } catch {
            failed += 1;
          }
        }
        if (failed === 0) {
          toast({
            title: "All cash-ups approved",
            description: `${ok} method${ok === 1 ? "" : "s"} confirmed.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Some approvals failed",
            description: `${ok} approved, ${failed} failed. Try the remaining rows individually.`,
          });
        }
        setOpen(false);
        router.refresh();
      })();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[30px] items-center gap-1.5 rounded-lg bg-pos px-3 text-[12px] font-semibold text-white transition-colors hover:bg-pos/90"
      >
        <Check className="h-3.5 w-3.5" />
        Approve all
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Approve all {pending.length} pending cash-up
              {pending.length === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              {varianceTotal === 0
                ? "Records your review across every submitted method. No net variance."
                : `Net variance across pending methods is ${fmtVariance(varianceTotal)}. Mobile-money variances post Over/Short entries to the ledger.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
