"use client";

import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTzs } from "@/types/loans/type";
import type {
  ApplicationStatus,
  LoanApplication,
} from "@/types/loans/applications";
import { OfferPanel } from "@/components/loans/offer-panel";

const TERMINAL_STATUSES = ["REJECTED", "WITHDRAWN", "EXPIRED"] as const;
type TerminalApplicationStatus = (typeof TERMINAL_STATUSES)[number];

function isTerminalStatus(
  status: ApplicationStatus,
): status is TerminalApplicationStatus {
  return (TERMINAL_STATUSES as readonly ApplicationStatus[]).includes(status);
}

export function ApplicationDetailClient({
  application,
  canApply,
  lpoId,
}: {
  application: LoanApplication;
  canApply: boolean;
  lpoId: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Fact label="Requested" value={formatTzs(application.requestedAmount)} />
          <Fact label="Requested term" value={`${application.requestedTermDays} days`} />
          {application.approvedAmount != null && (
            <Fact
              label="Approved"
              value={formatTzs(application.approvedAmount)}
              tone="pos"
            />
          )}
          {application.approvedTermDays != null && (
            <Fact label="Approved term" value={`${application.approvedTermDays} days`} />
          )}
        </div>

        {application.purpose && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
              Purpose
            </div>
            <div className="mt-1 text-sm text-ink-2">{application.purpose}</div>
          </div>
        )}

        {lpoId && (
          <div className={cn(application.purpose ? "mt-4" : "mt-5 border-t border-line pt-4")}>
            <Link
              href={`/purchase-orders/${lpoId}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
            >
              View purchase order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Status */}
      {isTerminalStatus(application.status) ? (
        <TerminalPanel
          status={application.status}
          declineReason={application.declineReason}
        />
      ) : (
        <StatusTimeline status={application.status} />
      )}

      {/* Offer acceptance */}
      {application.status === "APPROVED" && (
        <OfferPanel application={application} canApply={canApply} />
      )}

      {/* Durable post-acceptance link — driven by the DTO's own `loanId`, not
       *  OfferPanel's local success state, so it survives router.refresh() and
       *  any later revisit (OfferPanel unmounts once status leaves APPROVED). */}
      {application.status === "ACCEPTED" && (
        <AcceptedPanel loanId={application.loanId} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function Fact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos";
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[18px] font-bold tracking-tight",
          tone === "pos" ? "text-pos" : "text-ink",
        )}
      >
        {value}
      </div>
    </div>
  );
}

const TIMELINE_STAGES = ["Submitted", "Under review", "Offer", "Accepted"];

/** Which stage is current — DRAFT applications haven't cleared "Submitted" yet
 *  either, but that status shouldn't normally reach this borrower-facing list. */
function stageIndexFor(status: ApplicationStatus): number {
  switch (status) {
    case "COMPLIANCE_HOLD":
    case "IN_REVIEW":
      return 1;
    case "APPROVED":
      return 2;
    case "ACCEPTED":
      return 3;
    default:
      return 0; // DRAFT, SUBMITTED
  }
}

function stageDetail(stage: number, status: ApplicationStatus): string {
  if (stage === 0) return "We received your application.";
  if (stage === 1) {
    // COMPLIANCE_HOLD never actually reaches this DTO (masked to IN_REVIEW
    // server-side to avoid AML tipping-off) but the richer copy stays ready
    // for it — see types/loans/applications.ts.
    return status === "COMPLIANCE_HOLD"
      ? "Additional checks in progress."
      : "Our team is reviewing your application.";
  }
  if (stage === 2) {
    if (status === "APPROVED") return "Review and accept your offer below.";
    if (status === "ACCEPTED") return "Offer reviewed and accepted.";
    return "We'll notify you once a decision is made.";
  }
  return status === "ACCEPTED"
    ? "You accepted the offer."
    : "Accept your offer to complete this step.";
}

function StatusTimeline({ status }: { status: ApplicationStatus }) {
  const current = stageIndexFor(status);
  const allDone = status === "ACCEPTED";

  return (
    <div className="rounded-xl border border-line bg-card px-4.5 py-1.5">
      {TIMELINE_STAGES.map((title, i) => {
        const state = allDone || i < current ? "done" : i === current ? "now" : "todo";
        return (
          <div key={title} className="flex gap-3.5 py-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-full",
                  state === "done"
                    ? "bg-pos text-white"
                    : state === "now"
                      ? "bg-primary text-white"
                      : "border border-line-2 bg-canvas text-muted-2",
                )}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : state === "now" ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              {i < TIMELINE_STAGES.length - 1 && (
                <span className="my-1 w-px flex-1 bg-line" />
              )}
            </div>
            <div className="pt-0.5">
              <div
                className={cn(
                  "text-[13.5px] font-semibold",
                  state === "todo" ? "text-muted-foreground" : "text-ink",
                )}
              >
                {title}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {stageDetail(i, status)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TERMINAL_COPY: Record<
  TerminalApplicationStatus,
  { title: string; fallbackBody: string; tone: "neg" | "muted" }
> = {
  REJECTED: {
    title: "Application declined",
    fallbackBody: "This application wasn't approved.",
    tone: "neg",
  },
  WITHDRAWN: {
    title: "Application withdrawn",
    fallbackBody: "This application was withdrawn and is no longer active.",
    tone: "muted",
  },
  EXPIRED: {
    title: "Offer expired",
    fallbackBody:
      "The offer on this application expired before it was accepted.",
    tone: "muted",
  },
};

function TerminalPanel({
  status,
  declineReason,
}: {
  status: TerminalApplicationStatus;
  declineReason: string | null;
}) {
  const copy = TERMINAL_COPY[status];
  const body = declineReason ?? copy.fallbackBody;
  const Icon = status === "REJECTED" ? XCircle : status === "EXPIRED" ? Clock : Ban;
  const neg = copy.tone === "neg";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        neg
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-line-2 bg-canvas text-ink-3",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>
        <div className={cn("text-[13.5px] font-semibold", neg ? "text-red-700" : "text-ink-2")}>
          {copy.title}
        </div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

/**
 * Persistent post-acceptance affordance — the durable counterpart to
 * `OfferPanel`'s in-place success state. That panel only lives in
 * component state while `status === "APPROVED"`; the moment `router.refresh()`
 * lands (or the borrower revisits this page later) `status` is `ACCEPTED` and
 * `OfferPanel` stops mounting entirely, so this is the only place the loan
 * link survives. Sourced straight from the DTO's own `loanId` field.
 */
function AcceptedPanel({ loanId }: { loanId: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-pos/30 bg-pos-tint p-4">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-pos" />
      <div>
        <div className="text-[13.5px] font-semibold text-ink">
          Offer accepted — Settlo pays your supplier directly.
        </div>
        {loanId && (
          <Link
            href={`/loans/${loanId}`}
            className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
          >
            View loan
          </Link>
        )}
      </div>
    </div>
  );
}
