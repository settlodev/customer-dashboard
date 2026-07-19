"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Smartphone,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { previewPlanChange } from "@/lib/actions/billing-actions";
import { StatusPill } from "./pill";
import { CouponInput, type CouponInputHandle } from "./coupon-input";
import {
  formatAmount,
  formatBillingDate,
  formatPackagePrice,
  formatWhole,
  monthlyPrice,
} from "./shared";
import type { Coupon, Package, PlanChangePreview } from "@/types/billing/types";

/**
 * PayInvoiceDialog — the single "settle / extend" surface from the billing
 * design. It replaces the old standalone Renew tab: the period picker, the
 * per-entity package picker, the coupon, and the payment hand-off all live
 * here above a running total.
 *
 * Two modes:
 *   "pay"      — an invoice is already open. Paying it untouched settles it
 *                as billed; changing the period, a package, or applying a
 *                coupon re-issues it first.
 *   "generate" — nothing is outstanding. Picking a period generates a
 *                prepayment invoice and pays it in one step.
 */

const DURATIONS: Array<{ months: number; label: string }> = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
  { months: 36, label: "3 years" },
];

function durationLabelFor(months: number): string {
  return DURATIONS.find((d) => d.months === months)?.label ?? `${months} months`;
}

/** One billable entity shown as a row inside the dialog. */
export interface PayLine {
  itemId: string;
  /** Entity display name, e.g. "MAM N KIDZ KIBUGUMO". */
  name: string;
  /** Secondary line, e.g. "Location · v2". */
  sublabel: string;
  /** Package currently attached to the item (null on legacy rows). */
  currentPackageId: string | null;
  /** The item's package price normalised to a full year. */
  currentAnnual: number;
  /** Narrows the package options offered for this row. */
  entityType: Package["entityType"];
}

export interface PayConfirmPayload {
  months: number;
  total: number;
  /** Only the rows whose package the user actually changed. */
  planChanges: Array<{ itemId: string; packageId: string }>;
  couponCode?: string;
  /**
   * Set only when the owner chose to bill a SUBSET of entities. Undefined means
   * "bill everything", which keeps the normal pay/prepay paths untouched.
   */
  keepItemIds?: string[];
}

interface PayInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "pay" | "generate";
  currency: string;
  subscriptionId: string;
  /**
   * The subscription's own cycle length in months. The period picker defaults
   * here and "unchanged" means this value — a server-side re-price bills for
   * exactly this many months, so defaulting to a hard 12 would misquote every
   * monthly or quarterly account.
   */
  termMonths: number;
  /** Present in "pay" mode — the invoice being settled. */
  invoice?: {
    invoiceNumber: string;
    invoiceDate: string;
    lineCount: number;
    /** What the invoice is actually billed at today, before any re-issue. */
    total: number;
  } | null;
  lines: PayLine[];
  packages: Package[];
  /**
   * Whether the per-entity "bill this one" checkboxes can be offered. Only true
   * when the open invoice IS the current cycle's renewal — the adjust endpoint
   * matches on `period == [billingCycleStart, billingCycleEnd]` and errors when
   * nothing matches, so a prepayment-generated invoice must not offer this.
   */
  canAdjustKeepSet?: boolean;
  submitting?: boolean;
  onConfirm: (payload: PayConfirmPayload) => void;
}

/** A package's price normalised to a full year, whatever its interval. */
export function annualPrice(pkg: Pick<Package, "basePrice" | "billingInterval">): number {
  return pkg.billingInterval === "YEARLY" ? pkg.basePrice : pkg.basePrice * 12;
}

/** A preview keeps the package it answered for, so a stale response is ignored. */
type RowPreview = { packageId: string; preview: PlanChangePreview | null };

export function PayInvoiceDialog({
  open,
  onOpenChange,
  mode,
  currency,
  subscriptionId,
  termMonths,
  invoice,
  lines,
  packages,
  canAdjustKeepSet,
  submitting,
  onConfirm,
}: PayInvoiceDialogProps) {
  const isGenerate = mode === "generate";
  const offerKeepSet = !isGenerate && !!canAdjustKeepSet && lines.length > 1;
  const [months, setMonths] = useState(termMonths);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, RowPreview>>({});
  const [previewing, setPreviewing] = useState<Record<string, boolean>>({});
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  /** Entities the owner unticked — kept on the account, just not billed now. */
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const couponRef = useRef<CouponInputHandle>(null);

  // Reset every time the dialog reopens so a previous session's period, package
  // edits, coupon, or keep-set never leak into the next one.
  useEffect(() => {
    if (!open) return;
    setMonths(termMonths);
    setPreviews({});
    setPreviewing({});
    setCoupon(null);
    setDropped(new Set());
    setSelected(
      Object.fromEntries(
        lines
          .filter((line) => line.currentPackageId)
          .map((line) => [line.itemId, line.currentPackageId as string]),
      ),
    );
  }, [open, lines, termMonths]);

  const packagesByEntity = useMemo(() => {
    const map = new Map<string, Package[]>();
    for (const pkg of packages) {
      if (!pkg.isActive) continue;
      const list = map.get(pkg.entityType) ?? [];
      list.push(pkg);
      map.set(pkg.entityType, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => annualPrice(a) - annualPrice(b));
    }
    return map;
  }, [packages]);

  const packageById = useMemo(
    () => new Map(packages.map((pkg) => [pkg.id, pkg])),
    [packages],
  );

  // Ask the service what the change actually costs — and whether it is even
  // allowed. previewPlanChange is read-only and fails soft (null), so a preview
  // outage degrades to the client-side estimate rather than blocking payment.
  const pickPackage = useCallback(
    async (line: PayLine, packageId: string) => {
      setSelected((prev) => ({ ...prev, [line.itemId]: packageId }));
      if (packageId === line.currentPackageId) {
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[line.itemId];
          return next;
        });
        return;
      }
      setPreviewing((prev) => ({ ...prev, [line.itemId]: true }));
      try {
        const preview = await previewPlanChange(subscriptionId, line.itemId, packageId);
        setPreviews((prev) => ({ ...prev, [line.itemId]: { packageId, preview } }));
      } finally {
        setPreviewing((prev) => ({ ...prev, [line.itemId]: false }));
      }
    },
    [subscriptionId],
  );

  const priced = lines.map((line) => {
    const selectedId = selected[line.itemId] ?? line.currentPackageId ?? "";
    const pkg = packageById.get(selectedId);
    const annual = pkg ? annualPrice(pkg) : line.currentAnnual;
    const cached = previews[line.itemId];
    const isDropped = dropped.has(line.itemId);
    return {
      ...line,
      selectedId,
      dropped: isDropped,
      perMonth: pkg ? monthlyPrice(pkg) : line.currentAnnual / 12,
      changed: !isDropped && !!selectedId && selectedId !== line.currentPackageId,
      amount: isDropped ? 0 : (annual * months) / 12,
      /** > 0 upgrade, < 0 downgrade, 0 unchanged. */
      delta: annual - line.currentAnnual,
      options: packagesByEntity.get(line.entityType) ?? [],
      // Ignore a response that answered for a package the user has since changed.
      preview: cached?.packageId === selectedId ? cached.preview : null,
      loading: !!previewing[line.itemId],
    };
  });

  const keptLines = priced.filter((line) => !line.dropped);
  const hasDropped = offerKeepSet && keptLines.length < priced.length;
  const planChanges = priced
    .filter((line) => line.changed)
    .map((line) => ({ itemId: line.itemId, packageId: line.selectedId }));
  // `=== false` on purpose: a preview from an older service that omits the flag
  // must not read as "blocked" and lock the owner out of paying. A dropped row
  // isn't being billed, so a stale over-limit verdict on it must not block either.
  const blockedRows = priced.filter(
    (line) => !line.dropped && line.preview?.grandfathered === false,
  );
  // Dropping entities routes through the renewal-adjust endpoint, which always bills the
  // subscription's own term and takes no coupon. Rather than silently ignoring a period or
  // coupon the owner picked, lock both while a keep-set is in play — and vice versa, so the
  // two never fight over the same invoice.
  const periodOrCouponInUse = months !== termMonths || !!coupon;
  const keepSetLocked = periodOrCouponInUse;
  const periodLocked = hasDropped;

  const periodChanged = months !== termMonths;
  const reissues =
    !isGenerate &&
    (periodChanged || planChanges.length > 0 || !!coupon || hasDropped);

  // A single changed row can use the service's own re-priced figure. Two or more
  // can't be composed — each preview answers "what if only this row changed" —
  // and it only speaks for the subscription's own term, so any other period
  // falls back to the client estimate.
  const soloChange = planChanges.length === 1 ? priced.find((l) => l.changed) : undefined;
  const serverTotal =
    !periodChanged && soloChange?.preview?.repriceMode
      ? soloChange.preview.outstandingAfterChange
      : null;

  const computed = priced.reduce((sum, line) => sum + line.amount, 0);
  const settleAsBilled = !isGenerate && !reissues && invoice;
  // Once entities are dropped the invoice total no longer describes what will be billed,
  // so the estimate wins even where a single-row preview exists.
  const subtotal = hasDropped
    ? computed
    : (serverTotal ?? (settleAsBilled ? invoice.total : computed));
  // Anything that isn't the invoice's own total is PRE-DISCOUNT — that holds for
  // the client estimate and for outstandingAfterChange alike, which the service
  // documents as pre-discount (annual prepay, subscription discounts, and any
  // coupon land at confirm time). Only the issued invoice carries the real figure.
  const isEstimate = !settleAsBilled;

  const handleConfirm = useCallback(async () => {
    // A code typed but never "Applied" still counts — validate it before we
    // generate an invoice the owner didn't expect.
    const resolution = await couponRef.current?.resolve();
    if (resolution?.status === "invalid") return;
    onConfirm({
      months,
      total: subtotal,
      planChanges,
      couponCode: resolution?.coupon?.code ?? coupon?.code,
      keepItemIds: hasDropped ? keptLines.map((line) => line.itemId) : undefined,
    });
  }, [months, subtotal, planChanges, coupon, hasDropped, keptLines, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid max-h-[calc(100vh-4rem)] max-w-[640px] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0"
        overlayClassName="bg-foreground/40 backdrop-blur-sm"
      >
        <div className="border-b border-line pb-5 pl-7 pr-14 pt-6">
          <DialogTitle className="text-[21px] font-bold tracking-[-0.025em] text-ink">
            {isGenerate ? "Generate & pay invoice" : "Pay outstanding invoice"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
            {isGenerate
              ? "Set your billing period and packages, then pay to issue the invoice and extend access."
              : "Settle the open invoice to keep every entity active. Adjust the period or packages before paying — the invoice re-issues at your new total."}
          </DialogDescription>
        </div>

        <div className="min-h-0 overflow-y-auto px-7 py-6">
          {!isGenerate && invoice && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px] font-semibold text-ink">
                  {invoice.invoiceNumber}
                </p>
                <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
                  Issued {formatBillingDate(invoice.invoiceDate)} · covers{" "}
                  {invoice.lineCount} {invoice.lineCount === 1 ? "item" : "items"}
                </p>
              </div>
              <StatusPill tone={reissues ? "neutral" : "warn"}>
                {reissues ? "Re-issues" : "Due now"}
              </StatusPill>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="billing-period"
              className="text-[13px] font-medium text-ink-2"
            >
              Billing period
            </label>
            <Select
              value={String(months)}
              onValueChange={(value) => setMonths(Number(value))}
              disabled={periodLocked || submitting}
            >
              <SelectTrigger id="billing-period" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.months} value={String(d.months)}>
                    {d.label}
                    {d.months === termMonths ? " · your current cycle" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[12px] text-muted-foreground">
              {periodLocked ? (
                <span>
                  Fixed to your {durationLabelFor(termMonths)} cycle while you&apos;re
                  billing only some entities — re-tick them all to change it.
                </span>
              ) : reissues ? (
                <span className="text-[hsl(var(--primary-dark))]">
                  Paying re-issues this invoice for {durationLabelFor(months)}
                  {planChanges.length > 0 ? " with your package changes" : ""}
                  {coupon ? ` and coupon ${coupon.code}` : ""}.
                </span>
              ) : isGenerate ? (
                <span>
                  A new invoice is issued for {durationLabelFor(months)} the moment
                  you pay.
                </span>
              ) : (
                <span>
                  Billed for your {durationLabelFor(termMonths)} cycle — change the
                  period or packages below to adjust.
                </span>
              )}
            </p>
          </div>

          {priced.length > 0 && (
            <>
              <SectionLabel className="mt-6">
                Entities &amp; packages
                {offerKeepSet && (
                  <span className="ml-2 font-sans normal-case tracking-normal text-muted-foreground">
                    — untick one to leave it off this invoice
                  </span>
                )}
              </SectionLabel>
              <div className="overflow-hidden rounded-xl border border-line">
                {priced.map((line) => (
                  <div
                    key={line.itemId}
                    className={cn(
                      "flex flex-col gap-3 border-b border-line px-4 py-3.5 last:border-b-0",
                      line.dropped && "bg-surface",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {offerKeepSet && (
                          <Checkbox
                            className="mt-1"
                            checked={!line.dropped}
                            disabled={keepSetLocked || submitting}
                            aria-label={`Bill ${line.name} on this invoice`}
                            onCheckedChange={(checked) =>
                              setDropped((prev) => {
                                const next = new Set(prev);
                                if (checked) next.delete(line.itemId);
                                else next.add(line.itemId);
                                return next;
                              })
                            }
                          />
                        )}
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-[14px] font-semibold tracking-[-0.01em]",
                              line.dropped ? "text-muted-foreground" : "text-ink",
                            )}
                          >
                            {line.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                            {line.sublabel}
                          </p>
                        </div>
                      </div>
                      {line.dropped ? (
                        <p className="flex-none font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-2">
                          Not billed
                        </p>
                      ) : (
                        <div className="flex-none text-right">
                          <p className="font-mono text-[13.5px] tabular-nums text-ink-2">
                            {formatAmount(line.amount)} {currency}
                          </p>
                          {/* Spell out the rate the total is built from, so a package
                              priced on the wrong interval is caught here rather than
                              on the invoice. */}
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {formatWhole(line.perMonth)}/mo × {months}
                          </p>
                        </div>
                      )}
                    </div>
                    {line.dropped ? (
                      <p className="text-[12px] leading-relaxed text-muted-foreground">
                        Stays on your account but keeps no access until it&apos;s paid
                        for on a later invoice.
                      </p>
                    ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Select
                        value={line.selectedId}
                        onValueChange={(value) => void pickPackage(line, value)}
                        disabled={line.options.length === 0 || submitting}
                      >
                        <SelectTrigger
                          className="h-8 w-auto min-w-[220px] rounded-[7px] px-2.5 text-[12.5px]"
                          aria-label={`Package for ${line.name}`}
                        >
                          <SelectValue placeholder="No plan attached" />
                        </SelectTrigger>
                        <SelectContent>
                          {line.options.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} · {formatPackagePrice(pkg)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {line.loading ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking…
                        </span>
                      ) : (
                        <PlanDeltaBadge delta={line.delta} />
                      )}
                    </div>
                    )}
                    {!line.dropped && line.preview?.grandfathered === false && (
                      <p className="flex items-start gap-2 rounded-lg bg-neg-tint px-3 py-2 text-[12px] leading-relaxed text-neg">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                        <span>
                          This entity is over the plan&apos;s limits
                          {(line.preview.violations ?? []).length > 0
                            ? `: ${(line.preview.violations ?? [])
                                .map((v) => `${v.limitKey} ${v.current}/${v.limit}`)
                                .join(", ")}`
                            : ""}
                          . Reduce usage or pick a higher tier.
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 space-y-1.5 px-1">
            <SummaryRow
              label={
                isGenerate || reissues
                  ? `Subtotal · ${durationLabelFor(months)}`
                  : "Subtotal"
              }
              value={`${formatAmount(subtotal)} ${currency}`}
            />
            <SummaryRow
              label="Discounts"
              value={coupon ? `${coupon.code} applied` : "—"}
              tone={coupon ? "pos" : undefined}
            />
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <span className="text-[15px] font-bold text-ink">Total due</span>
              <span className="text-[20px] font-bold tracking-[-0.02em] tabular-nums text-ink">
                {formatAmount(subtotal)} {currency}
              </span>
            </div>
            {isEstimate && (
              <p className="pt-1 text-right text-[11.5px] text-muted-foreground">
                Estimated before discounts — the issued invoice carries the final
                amount.
              </p>
            )}
          </div>

          <div className="mt-5">
            <CouponInput
              ref={couponRef}
              onCouponChange={setCoupon}
              disabled={periodLocked || submitting}
            />
            {periodLocked && (
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Coupons apply to a full re-issue — re-tick every entity to use one.
              </p>
            )}
          </div>

          <SectionLabel className="mt-6">Pay with</SectionLabel>
          {/* Card is wired on the service (channel: CARD returns a Selcom gateway
              URL) but deliberately not offered yet — mobile money only for now. */}
          <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-primary bg-primary/[0.06] px-4 py-3.5 ring-[3px] ring-primary/15">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-primary/15 text-[hsl(var(--primary-dark))]">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
                Mobile money
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                M-Pesa · Tigo · Airtel — pick your provider next
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface px-7 py-4">
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Total due
            </p>
            <p className="mt-0.5 flex items-baseline gap-1.5 text-[20px] font-bold tracking-[-0.02em] tabular-nums text-ink">
              {formatAmount(subtotal)}
              <span className="font-mono text-[12px] font-medium text-muted-foreground">
                {currency}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="h-10"
              disabled={
                submitting ||
                subtotal <= 0 ||
                blockedRows.length > 0 ||
                keptLines.length === 0
              }
              title={
                keptLines.length === 0
                  ? "Tick at least one entity — to stop billing entirely, cancel the subscription."
                  : blockedRows.length > 0
                    ? "Resolve the over-limit entity before paying."
                    : undefined
              }
              onClick={() => void handleConfirm()}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {isGenerate
                ? "Generate & pay "
                : reissues
                  ? "Re-issue & pay "
                  : "Pay "}
              {formatWhole(subtotal)} {currency}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-ink-3">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          tone === "pos" ? "text-pos" : "text-ink-2",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PlanDeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-canvas px-2 py-1 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-ink-3">
        Unchanged
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10.5px] font-semibold tracking-[0.04em]",
        up ? "bg-pos-tint text-pos" : "bg-warn-tint text-warn",
      )}
    >
      {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {up ? "Upgrade" : "Downgrade"}
    </span>
  );
}
