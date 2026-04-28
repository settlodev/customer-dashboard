"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { acknowledgePublicLpo } from "@/lib/actions/lpo-actions";

type Decision = "ACCEPTED" | "REJECTED";

/**
 * Supplier-facing accept/decline strip for a shared LPO. Renders below the
 * printable document on /po/{token}. Hidden once a decision is recorded
 * (the server page no longer mounts this).
 */
export function PublicLpoAcknowledge({
  token,
  lpoNumber,
}: {
  token: string;
  lpoNumber: string;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [pending, startPending] = useTransition();
  const [done, setDone] = useState<Decision | null>(null);

  const submit = () => {
    if (!decision) return;
    startPending(async () => {
      const result = await acknowledgePublicLpo(token, { decision, note });
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't record your decision",
          description: result.message,
        });
        return;
      }
      toast({ title: result.message });
      setDone(decision);
    });
  };

  if (done) {
    const accepted = done === "ACCEPTED";
    return (
      <div className="mx-auto mt-6 flex w-full max-w-[210mm] items-center gap-3 rounded-xl border bg-white px-5 py-4 shadow-sm print:hidden">
        {accepted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <p className="text-sm">
          You have {accepted ? "accepted" : "rejected"} {lpoNumber}.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto mt-6 flex w-full max-w-[210mm] flex-col gap-3 rounded-xl border bg-white px-5 py-4 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Confirm this purchase order
          </p>
          <p className="text-xs text-muted-foreground">
            Your decision is binding — the buyer cannot receive stock against
            this order until you accept.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDecision("REJECTED")}
            disabled={pending}
          >
            <XCircle className="mr-1.5 h-4 w-4 text-red-600" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => setDecision("ACCEPTED")}
            disabled={pending}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Accept
          </Button>
        </div>
      </div>

      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={!pending ? () => setDecision(null) : undefined}
          />
          <div className="relative w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex justify-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  decision === "ACCEPTED" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {decision === "ACCEPTED" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                {decision === "ACCEPTED"
                  ? "Accept this purchase order?"
                  : "Reject this purchase order?"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {decision === "ACCEPTED"
                  ? "By accepting, you commit to fulfilling this order on the agreed terms."
                  : "Optionally tell the buyer why so they can revise the order."}
              </p>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                decision === "ACCEPTED"
                  ? "Optional note for the buyer"
                  : "Reason for rejection (optional)"
              }
              rows={3}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDecision(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={pending}
                variant={decision === "ACCEPTED" ? "default" : "destructive"}
              >
                {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {decision === "ACCEPTED" ? "Accept order" : "Reject order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
