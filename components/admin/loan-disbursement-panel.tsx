"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import {
  confirmDisbursement,
  initiateDisbursement,
} from "@/lib/actions/admin/loans";
import {
  fmtAmount,
  FUNDING_SOURCE_TYPE_LABELS,
  payoutAccountLabel,
  type DisbursementResponse,
  type FundingSourceResponse,
  type LoanResponse,
  type PayoutAccountResponse,
} from "@/types/admin/loans";

interface DisbursementPanelProps {
  loan: LoanResponse;
  fundingSources: FundingSourceResponse[];
  payoutAccounts: PayoutAccountResponse[];
  disbursements: DisbursementResponse[];
}

export function LoanDisbursementPanel({
  loan,
  fundingSources,
  payoutAccounts,
  disbursements,
}: DisbursementPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const activeSources = useMemo(
    () => fundingSources.filter((f) => f.active),
    [fundingSources],
  );
  const defaultAccount = useMemo(
    () => payoutAccounts.find((a) => a.defaultAccount) ?? payoutAccounts[0],
    [payoutAccounts],
  );

  // A live (INITIATED/SUBMITTED) disbursement means we resume mid-flow after a reload.
  const initialLive =
    disbursements.find((d) => d.status === "INITIATED") ??
    disbursements.find((d) => d.status === "SUBMITTED") ??
    null;
  const [current, setCurrent] = useState<DisbursementResponse | null>(
    initialLive,
  );

  const [fundingSourceId, setFundingSourceId] = useState<string>(
    activeSources[0]?.id ?? "",
  );
  const [payoutAccountId, setPayoutAccountId] = useState<string>(
    defaultAccount?.id ?? "",
  );
  const [externalRef, setExternalRef] = useState("");

  const initiate = () => {
    setError("");
    startTransition(async () => {
      const res = await initiateDisbursement(loan.id, {
        fundingSourceId,
        payoutAccountId,
      });
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      const d = res.data ?? null;
      if (d?.status === "FAILED") {
        setError(d.failureReason || "The funding gateway rejected this disbursement.");
        return;
      }
      setCurrent(d);
      toast({
        title:
          d?.status === "SUBMITTED"
            ? "Submitted to gateway"
            : "Disbursement initiated",
        description: res.message,
      });
    });
  };

  const confirm = () => {
    if (!current) return;
    setError("");
    startTransition(async () => {
      const res = await confirmDisbursement(current.id, {
        externalRef,
        loanId: loan.id,
      });
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: "Disbursement confirmed", description: res.message });
      router.refresh();
    });
  };

  // ── Confirm step (manual, INITIATED) ──────────────────────────────
  if (current?.status === "INITIATED") {
    return (
      <section className="rounded-xl border border-line bg-card">
        <header className="border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink">
            Confirm disbursement
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Funds released manually — enter the payment reference to mark it
            paid and activate the loan.
          </p>
        </header>
        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-line bg-surface/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Amount</span>{" "}
            <span className="font-mono font-medium text-ink">
              {fmtAmount(current.amount)} {loan.currency}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="external-ref" className="text-xs">
              Payment reference <span className="text-primary">*</span>
            </Label>
            <Input
              id="external-ref"
              value={externalRef}
              onChange={(e) => setExternalRef(e.target.value)}
              placeholder="e.g. bank / mobile transfer ref"
              disabled={isPending}
            />
          </div>
          {error ? <FormError message={error} /> : null}
          <Button
            type="button"
            onClick={confirm}
            disabled={isPending || externalRef.trim().length === 0}
            className="bg-pos hover:bg-pos/90"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Confirm &amp; activate
          </Button>
        </div>
      </section>
    );
  }

  // ── Awaiting gateway (automated, SUBMITTED) ───────────────────────
  if (current?.status === "SUBMITTED") {
    return (
      <section className="rounded-xl border border-line bg-card">
        <header className="border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink">
            Disbursement submitted
          </h3>
        </header>
        <div className="p-5 text-sm text-muted-foreground">
          Sent to the funding gateway
          {current.providerRef ? ` (ref ${current.providerRef})` : ""}. The loan
          activates automatically once the gateway confirms settlement.
        </div>
      </section>
    );
  }

  // ── Initiate step ─────────────────────────────────────────────────
  const priorFailure = disbursements.find((d) => d.status === "FAILED");
  const canInitiate =
    activeSources.length > 0 &&
    payoutAccounts.length > 0 &&
    Boolean(fundingSourceId) &&
    Boolean(payoutAccountId);

  return (
    <section className="rounded-xl border border-line bg-card">
      <header className="border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Disburse loan</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Release {fmtAmount(loan.principal)} {loan.currency} to the borrower&apos;s
          payout account.
        </p>
      </header>
      <div className="space-y-4 p-5">
        {priorFailure ? (
          <div className="rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-xs text-neg">
            Previous attempt failed
            {priorFailure.failureReason
              ? `: ${priorFailure.failureReason}`
              : ""}
            . You can retry.
          </div>
        ) : null}

        {activeSources.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            No active funding source — add one under Funding sources first.
          </div>
        ) : null}
        {payoutAccounts.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            This business hasn&apos;t set up a payout account yet.
          </div>
        ) : null}

        {activeSources.length > 0 && payoutAccounts.length > 0 ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Funding source</Label>
              <Select
                value={fundingSourceId}
                onValueChange={setFundingSourceId}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a funding source" />
                </SelectTrigger>
                <SelectContent>
                  {activeSources.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} · {FUNDING_SOURCE_TYPE_LABELS[f.type]} ·{" "}
                      {f.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payout account</Label>
              <Select
                value={payoutAccountId}
                onValueChange={setPayoutAccountId}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a payout account" />
                </SelectTrigger>
                <SelectContent>
                  {payoutAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {payoutAccountLabel(a)}
                      {a.defaultAccount ? " · default" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}

        {error ? <FormError message={error} /> : null}

        <Button
          type="button"
          onClick={initiate}
          disabled={isPending || !canInitiate}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          Initiate disbursement
        </Button>
      </div>
    </section>
  );
}
