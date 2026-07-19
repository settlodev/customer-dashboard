"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { changeItemPlan, previewPlanChange } from "@/lib/actions/billing-actions";
import type { Package, PlanChangePreview, SubscriptionItem } from "@/types/billing/types";

interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  item: SubscriptionItem | null;
  /** Catalog already loaded by the parent — keeps the dialog snappy. */
  packages: Package[];
}

function classifyChange(currentPrice: number, nextPrice: number) {
  if (nextPrice > currentPrice) {
    return { label: "Upgrade", Icon: ArrowUp, tone: "bg-pos-tint text-pos" };
  }
  if (nextPrice < currentPrice) {
    return { label: "Downgrade", Icon: ArrowDown, tone: "bg-warn-tint text-warn" };
  }
  return { label: "Switch", Icon: ArrowRight, tone: "bg-canvas text-ink-3" };
}

export function PlanChangeDialog({
  open,
  onOpenChange,
  subscriptionId,
  item,
  packages,
}: PlanChangeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setPreview(null);
    }
  }, [open]);

  // Live preview whenever a target plan is picked: a prorated delta when this unit has
  // already paid for the cycle, or the re-priced outstanding amount when it's unpaid/expired
  // (the "change before paying" regime). Read-only — never mutates.
  useEffect(() => {
    if (!open || !item || !selectedId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    previewPlanChange(subscriptionId, item.id, selectedId)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, item, selectedId, subscriptionId]);

  const eligible = useMemo(() => {
    if (!item) return [];
    return packages
      .filter((p) => p.isActive && p.entityType === item.entityType)
      .sort((a, b) => a.basePrice - b.basePrice);
  }, [packages, item]);

  const currentPackage = useMemo(
    () => (item?.packageInfo ? packages.find((p) => p.id === item.packageInfo!.id) ?? item.packageInfo : null),
    [packages, item],
  );

  // The target plan's per-entity limits sit below current usage — block the change.
  const blockedByCaps = preview != null && !preview.grandfathered;

  const handleConfirm = useCallback(async () => {
    if (!item || !selectedId) return;
    setSubmitting(true);
    try {
      await changeItemPlan(subscriptionId, item.id, selectedId);
      toast({
        title: "Plan updated",
        description: preview?.repriceMode
          ? "Your outstanding invoice has been re-issued at the new plan. Pay it to activate."
          : "Your subscription has been changed. A prorated invoice will follow.",
      });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Plan change failed",
        description: (error as Error)?.message ?? "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [item, selectedId, subscriptionId, toast, onOpenChange, router, preview]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" overlayClassName="bg-foreground/30 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            Pick a new plan for{" "}
            <span className="font-medium text-ink">
              {item.packageInfo?.name ?? "this item"}
            </span>
            . If this unit has already paid for the current cycle the difference is prorated; if
            it&apos;s unpaid or expired we re-issue your outstanding invoice at the new plan — pay
            it to activate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2">
          {eligible.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No alternative plans available for this {item.entityType.toLowerCase()}.
            </p>
          )}
          {eligible.map((pkg) => {
            const isCurrent = pkg.id === item.packageInfo?.id;
            const isSelected = pkg.id === selectedId;
            const currentPrice = currentPackage?.basePrice ?? 0;
            const meta = classifyChange(currentPrice, pkg.basePrice);
            const ChangeIcon = meta.Icon;

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => !isCurrent && setSelectedId(pkg.id)}
                disabled={isCurrent}
                className={cn(
                  "group relative flex h-full flex-col items-stretch gap-3 rounded-xl border bg-card p-4 text-left transition-all",
                  isCurrent && "cursor-not-allowed opacity-70",
                  !isCurrent && "hover:border-line-2 hover:shadow-sm",
                  isSelected && "border-primary ring-2 ring-primary/15",
                  !isSelected && !isCurrent && "border-line",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      {pkg.billingInterval.toLowerCase()}
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold text-ink">{pkg.name}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    {isCurrent && <Badge variant="soft">Current</Badge>}
                    {!isCurrent && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium",
                          meta.tone,
                        )}
                      >
                        <ChangeIcon className="h-2.5 w-2.5" />
                        {meta.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 text-ink">
                  <span className="text-xl font-semibold tabular-nums">
                    {pkg.basePrice.toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    TZS / {pkg.billingInterval === "YEARLY" ? "yr" : "mo"}
                  </span>
                </div>

                {pkg.description && (
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                    {pkg.description}
                  </p>
                )}

                {!isCurrent && currentPackage && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {pkg.basePrice >= currentPackage.basePrice ? "+" : ""}
                    {(pkg.basePrice - currentPackage.basePrice).toLocaleString()} vs. current
                  </p>
                )}

                {isSelected && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Live preview of the financial effect of the selected change */}
        {selectedId && (
          <div
            className={cn(
              "rounded-lg border p-3 text-[12.5px]",
              blockedByCaps
                // --neg-tint already carries its own alpha; stacking an
                // opacity modifier on it emits invalid CSS and drops the fill.
                ? "border-neg/40 bg-neg-tint text-neg"
                : "border-line bg-canvas/40 text-muted-foreground",
            )}
          >
            {previewLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating…
              </span>
            ) : blockedByCaps ? (
              <span className="inline-flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  This plan&apos;s limits are below your current usage
                  {preview?.violations?.length
                    ? `: ${preview.violations
                        .map((v) => `${v.limitKey} ${v.current}/${v.limit}`)
                        .join(", ")}`
                    : ""}
                  . Reduce usage or pick a larger plan.
                </span>
              </span>
            ) : preview?.repriceMode ? (
              <span>
                We&apos;ll re-issue your outstanding invoice at this plan
                {preview.outstandingAfterChange != null && (
                  <>
                    {" — about "}
                    <span className="font-semibold text-ink">
                      {formatMoney(preview.outstandingAfterChange, "TZS")}
                    </span>
                    {" before discounts"}
                  </>
                )}
                . Pay it to activate the new plan.
              </span>
            ) : preview ? (
              <span>
                {preview.proratedDelta > 0
                  ? `Prorated charge today: ${formatMoney(preview.proratedDelta, "TZS")}.`
                  : preview.proratedDelta < 0
                    ? `Prorated credit: ${formatMoney(Math.abs(preview.proratedDelta), "TZS")}.`
                    : "No change to your current charge."}
              </span>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedId
                ? `New plan price: ${formatMoney(
                    eligible.find((p) => p.id === selectedId)?.basePrice ?? 0,
                    "TZS",
                  )}`
                : "Pick a plan to continue"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!selectedId || submitting || previewLoading || blockedByCaps}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Confirm change"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
