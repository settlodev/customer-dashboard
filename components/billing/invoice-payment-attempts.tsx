"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentResponse, PaymentStatus } from "@/types/billing/types";

/**
 * Statuses that block the parent invoice from being cancelled. Exported so
 * the dialog can gate its Cancel button against the same data this list
 * renders — keep the two in sync with the server's BLOCKING_STATUSES in
 * `SelcomPaymentService`.
 */
export const BLOCKING_PAYMENT_STATUSES: PaymentStatus[] = [
  "ACCEPTED",
  "PROCESSING",
  "SUCCESS",
];

export function hasBlockingPayment(attempts: PaymentResponse[] | null): boolean {
  if (!attempts) return false;
  return attempts.some((a) => BLOCKING_PAYMENT_STATUSES.includes(a.paymentStatus));
}

/**
 * Renders every Selcom payment attempt against an invoice — succeeded,
 * failed, and in-flight — newest first. Pure presenter; the parent owns
 * the fetch so it can share the same `attempts` array with the cancel-
 * button gating logic.
 */
export function InvoicePaymentAttempts({
  attempts,
  loading,
  error,
}: {
  attempts: PaymentResponse[] | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        Payment attempts
      </p>

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading history…
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-3 text-xs text-neg">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {!loading && !error && attempts && attempts.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-3 text-xs text-muted-foreground">
          No payment attempts yet.
        </p>
      )}

      {!loading && !error && attempts && attempts.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {attempts.map((a) => (
            <AttemptRow key={a.externalReferenceId} attempt={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: PaymentResponse }) {
  const meta = STATUS_META[attempt.paymentStatus] ?? STATUS_META.PROCESSING;
  const Icon = meta.icon;
  const when = attempt.paidAt ?? attempt.createdAt;

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-start gap-3 bg-card px-3 py-2.5 text-xs">
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 place-items-center rounded-full",
          meta.iconBg,
        )}
        aria-hidden
      >
        <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={meta.badgeClass}>
            {meta.label}
          </Badge>
          {attempt.customerPhoneNumber && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              {attempt.customerPhoneNumber}
            </span>
          )}
          {attempt.channel && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {attempt.channel === "MOBILE_MONEY" ? "MOBILE MONEY" : attempt.channel}
            </span>
          )}
        </div>
        {attempt.transactionId && (
          <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
            Selcom transid: {attempt.transactionId}
          </p>
        )}
        {attempt.paymentStatus === "FAILED" && attempt.errorMessage && (
          <p className="mt-0.5 text-[11px] text-neg">{attempt.errorMessage}</p>
        )}
      </div>

      {when && (
        <time
          className="whitespace-nowrap pt-0.5 font-mono text-[10.5px] text-muted-foreground"
          dateTime={when}
          title={new Date(when).toLocaleString()}
        >
          {formatRelative(when)}
        </time>
      )}
    </li>
  );
}

const STATUS_META: Record<
  PaymentStatus,
  {
    label: string;
    icon: typeof Loader2;
    iconBg: string;
    iconClass: string;
    badgeClass: string;
  }
> = {
  ACCEPTED: {
    label: "Initiating",
    icon: Loader2,
    iconBg: "bg-primary-light",
    iconClass: "text-primary animate-spin",
    badgeClass: "border-primary/30 text-primary",
  },
  PROCESSING: {
    label: "Awaiting",
    icon: Clock,
    iconBg: "bg-warn-tint",
    iconClass: "text-warn",
    badgeClass: "border-warn/30 text-warn",
  },
  SUCCESS: {
    label: "Paid",
    icon: CheckCircle2,
    iconBg: "bg-pos-tint",
    iconClass: "text-pos",
    badgeClass: "border-pos/30 text-pos",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    iconBg: "bg-neg-tint",
    iconClass: "text-neg",
    badgeClass: "border-neg/30 text-neg",
  },
};

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "—";
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
