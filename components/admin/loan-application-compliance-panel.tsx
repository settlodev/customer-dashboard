"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, ShieldCheck, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { resolveApplicationCompliance } from "@/lib/actions/admin/loans";
import type { LoanApplicationResponse } from "@/types/admin/loans";

interface CompliancePanelProps {
  application: LoanApplicationResponse;
  /** Resolved display name of the borrower account (owner), when the directory has it. */
  accountName?: string | null;
}

/**
 * Officer resolution of a COMPLIANCE_HOLD (KYC / sanctions screening).
 * CLEAR resumes the application into credit assessment; REJECT is terminal —
 * the notes become the recorded rejection reason. The borrower only ever sees
 * "under review" while held (AML no-tipping-off), so wording here is internal.
 */
export function LoanApplicationCompliancePanel({
  application,
  accountName,
}: CompliancePanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"clear" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = (decision: "CLEAR" | "REJECT") => {
    setError("");
    startTransition(async () => {
      const res = await resolveApplicationCompliance(application.id, {
        decision,
        notes: notes.trim() || undefined,
      });
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({ title: res.message });
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-line bg-card">
      <header className="border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Compliance hold</h3>
      </header>
      <div className="space-y-4 p-5">
        {application.complianceHoldReason ? (
          <div className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-800">
            {application.complianceHoldReason}
          </div>
        ) : null}

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Account</dt>
            <dd className="font-medium">
              <Link
                href={`/accounts/${application.accountId}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {accountName ?? `••${application.accountId.slice(-8)}`}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">KYC verified</dt>
            <dd className="font-medium text-ink">
              {application.kycVerified == null
                ? "Unknown"
                : application.kycVerified
                  ? "Yes"
                  : "No"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Sanctions screening</dt>
            <dd className="font-medium text-ink">
              {application.sanctionsStatus ?? "Unknown"}
            </dd>
          </div>
          {application.complianceCheckedAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Checked at</dt>
              <dd className="font-medium text-ink">
                {new Date(application.complianceCheckedAt).toLocaleString()}
              </dd>
            </div>
          ) : null}
        </dl>

        {mode === null ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={() => setMode("clear")}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Clear hold
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 text-neg hover:text-neg"
              disabled={isPending}
              onClick={() => setMode("reject")}
            >
              <ShieldX className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="compliance-notes">
                {mode === "clear"
                  ? "Notes (optional)"
                  : "Rejection reason (recorded on the application)"}
              </Label>
              <Textarea
                id="compliance-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  mode === "clear"
                    ? "e.g. False positive — name match only, documents verified."
                    : "e.g. Confirmed sanctions list match."
                }
                disabled={isPending}
              />
            </div>
            <FormError message={error} />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={() => {
                  setMode(null);
                  setError("");
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                variant={mode === "reject" ? "destructive" : "default"}
                disabled={
                  isPending || (mode === "reject" && !notes.trim())
                }
                onClick={() => submit(mode === "clear" ? "CLEAR" : "REJECT")}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "clear" ? (
                  "Confirm clear"
                ) : (
                  "Confirm reject"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
