"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
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
import { changeItemPlan } from "@/lib/actions/billing-actions";
import type { Package, SubscriptionItem } from "@/types/billing/types";

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

  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

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

  const handleConfirm = useCallback(async () => {
    if (!item || !selectedId) return;
    setSubmitting(true);
    try {
      await changeItemPlan(subscriptionId, item.id, selectedId);
      toast({
        title: "Plan updated",
        description: "Your subscription has been changed. A prorated invoice will follow.",
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
  }, [item, selectedId, subscriptionId, toast, onOpenChange, router]);

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
            . Pricing changes apply on the next billing cycle, with proration generated immediately.
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
              <Button size="sm" onClick={handleConfirm} disabled={!selectedId || submitting}>
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
