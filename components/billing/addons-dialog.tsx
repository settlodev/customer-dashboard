"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
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
import { addItemAddon, removeItemAddon } from "@/lib/actions/billing-actions";
import type { Addon, SubscriptionItem } from "@/types/billing/types";

interface AddonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  item: SubscriptionItem | null;
  addons: Addon[];
}

export function AddonsDialog({
  open,
  onOpenChange,
  subscriptionId,
  item,
  addons,
}: AddonsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyAddonId, setBusyAddonId] = useState<string | null>(null);

  const activeAddonIds = useMemo(
    () => new Set(item?.addons.map((a) => a.id) ?? []),
    [item],
  );

  const handleToggle = useCallback(
    async (addon: Addon) => {
      if (!item) return;
      const isAttached = activeAddonIds.has(addon.id);
      setBusyAddonId(addon.id);
      try {
        if (isAttached) {
          await removeItemAddon(subscriptionId, item.id, addon.id);
          toast({ title: "Addon removed", description: `${addon.name} unlinked from this item.` });
        } else {
          await addItemAddon(subscriptionId, item.id, addon.id);
          toast({ title: "Addon added", description: `${addon.name} attached. A prorated charge will follow.` });
        }
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not update addon",
          description: (error as Error)?.message ?? "Please try again.",
        });
      } finally {
        setBusyAddonId(null);
      }
    },
    [item, subscriptionId, activeAddonIds, toast, router],
  );

  if (!item) return null;

  const activeAddons = addons.filter((a) => a.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" overlayClassName="bg-foreground/30 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Manage addons</DialogTitle>
          <DialogDescription>
            Attach or detach paid addons for{" "}
            <span className="font-medium text-ink">
              {item.packageInfo?.name ?? "this item"}
            </span>
            . Changes apply immediately and are prorated on the next invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {activeAddons.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No addons are available to attach right now.
            </p>
          )}
          {activeAddons.map((addon) => {
            const isAttached = activeAddonIds.has(addon.id);
            const isBusy = busyAddonId === addon.id;
            return (
              <div
                key={addon.id}
                className="flex items-start justify-between gap-3 bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-pos" />
                    <p className="font-medium text-ink">{addon.name}</p>
                    {isAttached && <Badge variant="pos">Attached</Badge>}
                  </div>
                  {addon.description && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {addon.description}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {formatMoney(addon.price, "TZS")} / month
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isAttached ? "outline" : "default"}
                  onClick={() => handleToggle(addon)}
                  disabled={isBusy}
                  className="min-w-[88px]"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isAttached ? (
                    "Remove"
                  ) : (
                    "Attach"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
