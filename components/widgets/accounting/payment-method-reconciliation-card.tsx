"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { approvePaymentMethodReconciliation } from "@/lib/actions/payment-method-reconciliation-actions";
import {
  PM_RECON_STATUS_TONE,
  type PaymentMethodReconciliation,
} from "@/types/payment-method-reconciliation/type";

const fmt = (n?: number | null) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const fmtVariance = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;

const varianceClass = (n: number) =>
  n === 0 ? "text-gray-500" : n > 0 ? "text-amber-600" : "text-red-600";

export function PaymentMethodReconciliationCard({
  reconciliations,
  sessionId,
}: {
  reconciliations: PaymentMethodReconciliation[];
  sessionId: string;
}) {
  if (!reconciliations || reconciliations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">End-of-day cash-up</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          No cash-up was recorded for this session.
        </CardContent>
      </Card>
    );
  }

  const expectedTotal = reconciliations.reduce(
    (s, r) => s + (r.expectedAmount ?? 0),
    0,
  );
  const countedTotal = reconciliations.reduce(
    (s, r) => s + (r.countedAmount ?? 0),
    0,
  );
  const varianceTotal = countedTotal - expectedTotal;
  const currency = reconciliations.find((r) => r.currency)?.currency ?? "";
  const pending = reconciliations.filter((r) => r.status === "SUBMITTED").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>End-of-day cash-up{currency ? ` · ${currency}` : ""}</span>
          {pending > 0 ? (
            <Badge variant="warn">{pending} awaiting approval</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3 font-medium">Method</th>
                <th className="px-3 py-2 text-right font-medium">Expected</th>
                <th className="px-3 py-2 text-right font-medium">Counted</th>
                <th className="px-3 py-2 text-right font-medium">Variance</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="py-2 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium">
                      {r.paymentMethodName ?? r.paymentMethodCode ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {fmt(r.expectedAmount)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {fmt(r.countedAmount)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-medium ${varianceClass(
                      r.variance ?? 0,
                    )}`}
                  >
                    {fmtVariance(r.variance ?? 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={PM_RECON_STATUS_TONE[r.status] ?? "soft"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    {r.status === "SUBMITTED" ? (
                      <PermissionGuard permission="till_reconciliation:approve">
                        <ApproveButton recon={r} sessionId={sessionId} />
                      </PermissionGuard>
                    ) : null}
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2.5 pr-3">Total</td>
                <td className="px-3 py-2.5 text-right">{fmt(expectedTotal)}</td>
                <td className="px-3 py-2.5 text-right">{fmt(countedTotal)}</td>
                <td
                  className={`px-3 py-2.5 text-right ${varianceClass(varianceTotal)}`}
                >
                  {fmtVariance(varianceTotal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-gray-500">
          Approving records the manager review. For offline mobile money a
          variance posts a Mobile Money Over/Short entry to the ledger; cash
          reconciles via the till and provider methods via settlement.
        </p>
      </CardContent>
    </Card>
  );
}

function ApproveButton({
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
        </Button>
      </DialogTrigger>
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
  );
}
