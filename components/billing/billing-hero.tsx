"use client";

import React from "react";
import { CheckCircle2, Eye, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmount } from "./shared";

/**
 * The two mutually-exclusive states that open the Overview tab.
 *
 *   <DueCard>     — an invoice is open. Dark, high-contrast banner that
 *                   states the amount, what it covers, and how to settle.
 *   <SettledCard> — nothing outstanding. Quiet card that offers to
 *                   prepay/extend instead.
 *
 * `bg-ink` + `text-card` is intentionally self-inverting: in light mode
 * that reads as white-on-near-black, in dark mode as dark-on-near-white,
 * so the banner keeps its contrast in both themes without a `dark:`
 * variant on every child.
 */

export interface DueGroup {
  /** e.g. "Settlo Enterprise" — the plan or line description. */
  label: string;
  /** How many entities/lines rolled into this group. */
  quantity: number;
  amount: number;
}

interface DueCardProps {
  invoiceNumber: string;
  total: number;
  currency: string;
  /** Number of entities/line items the invoice covers. */
  lineCount: number;
  groups: DueGroup[];
  onPay: () => void;
  onView: () => void;
}

export function DueCard({
  invoiceNumber,
  total,
  currency,
  lineCount,
  groups,
  onPay,
  onView,
}: DueCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-ink text-card shadow-[0_14px_40px_-18px_rgba(20,17,12,0.4)] lg:flex-row lg:items-stretch">
      <div className="min-w-0 flex-1 px-6 py-6">
        <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-card/55">
          <span className="h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_0_4px_rgba(235,127,68,0.25)]" />
          Amount due now
        </p>
        <p className="mt-2.5 flex items-baseline gap-1.5 text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums">
          {formatAmount(total)}
          <span className="font-mono text-[13px] font-medium tracking-[0.02em] text-card/55">
            {currency}
          </span>
        </p>
        <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-card/70">
          Invoice <span className="font-semibold text-card">{invoiceNumber}</span> covers{" "}
          <span className="font-semibold text-card">
            {lineCount} {lineCount === 1 ? "item" : "items"}
          </span>
          . Settle it to keep every subscribed entity active.
        </p>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col justify-center gap-2.5 border-t border-card/15 px-6 py-6 lg:min-w-[290px] lg:border-l lg:border-t-0">
          {groups.map((group) => (
            <div
              key={group.label}
              className="flex items-baseline justify-between gap-4 text-[13px]"
            >
              <span className="min-w-0 truncate text-card/70">
                <span className="font-semibold text-card">{group.quantity}×</span>{" "}
                {group.label}
              </span>
              <span className="flex-none font-mono tabular-nums">
                {formatAmount(group.amount)}
              </span>
            </div>
          ))}
          <div className="mt-0.5 flex items-baseline justify-between gap-4 border-t border-card/15 pt-2.5 text-[13px]">
            <span className="font-semibold">Total</span>
            <span className="flex-none font-mono font-semibold tabular-nums">
              {formatAmount(total)} {currency}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center gap-2.5 border-t border-card/15 px-6 py-6 lg:border-l lg:border-t-0">
        <Button onClick={onPay} className="h-10 whitespace-nowrap">
          <Zap className="h-3.5 w-3.5" />
          Pay now
        </Button>
        <Button
          variant="ghost"
          onClick={onView}
          className="h-10 whitespace-nowrap border border-card/30 text-card hover:border-card/40 hover:bg-card/10 hover:text-card"
        >
          <Eye className="h-3.5 w-3.5" />
          View details
        </Button>
      </div>
    </div>
  );
}

interface SettledCardProps {
  onGenerate: () => void;
  /** Disabled while the subscription can't take a new prepayment invoice. */
  disabled?: boolean;
}

export function SettledCard({ onGenerate, disabled }: SettledCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-ink text-card shadow-[0_14px_40px_-18px_rgba(20,17,12,0.4)] lg:flex-row lg:items-stretch">
      <div className="flex min-w-0 flex-1 items-center gap-4 px-6 py-6">
        {/* Solid `bg-pos` with a `text-card` glyph so the tile keeps its
            contrast whichever way the inverted banner resolves. */}
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-pos text-card">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[19px] font-bold tracking-[-0.02em]">
            You&apos;re all settled
          </p>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-card/70">
            No invoice is open. Generate one to prepay and extend access — pick
            your billing period on the next step.
          </p>
        </div>
      </div>
      <div className="flex items-center border-t border-card/15 px-6 py-6 lg:border-l lg:border-t-0">
        <Button
          onClick={onGenerate}
          disabled={disabled}
          className="h-10 w-full whitespace-nowrap lg:w-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Generate invoice &amp; pay
        </Button>
      </div>
    </div>
  );
}
