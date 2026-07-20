"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getAddonFeatures,
  removeAddonFeature,
  setAddonFeature,
} from "@/lib/actions/admin/billing";
import type {
  AddonFeatureResponse,
  AddonResponse,
  FeatureResponse,
} from "@/types/admin/billing";

/**
 * What an addon actually lifts.
 *
 * An addon with no bindings is billable but changes nothing — it takes the customer's money
 * and leaves every limit where it was. Only the six capacity addons seeded in migration V8
 * had bindings, because they were written straight into SQL; anything created from this
 * dashboard had none until now.
 *
 * The value is the NEW CEILING, not an increment. Entitlements resolve a limit as
 * `Math.max(package value, each active addon value)`, so a staff addon meant to take a
 * 10-staff package to 20 stores `20`. Storing `10` would change nothing at all.
 */
export function AddonLimitsDialog({
  addon,
  features,
  open,
  onOpenChange,
}: {
  addon: AddonResponse | null;
  /** The platform feature catalog, for the picker. */
  features: FeatureResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [bindings, setBindings] = useState<AddonFeatureResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [featureId, setFeatureId] = useState("");
  const [value, setValue] = useState("");

  // LIMIT features are the only ones a ceiling makes sense for — a CORE/PREMIUM
  // feature is on or off, not a number.
  const limitFeatures = features.filter(
    (f) => f.featureType === "LIMIT" && f.isActive !== false,
  );

  const load = useCallback(async () => {
    if (!addon) return;
    setLoadError(null);
    try {
      setBindings(await getAddonFeatures(addon.id));
    } catch (error) {
      setBindings([]);
      setLoadError(
        (error as Error)?.message ?? "Couldn't load this addon's limits.",
      );
    }
  }, [addon]);

  useEffect(() => {
    if (!open || !addon) {
      setBindings(null);
      setFeatureId("");
      setValue("");
      setLoadError(null);
      return;
    }
    void load();
  }, [open, addon, load]);

  const save = () => {
    if (!addon || !featureId || !value.trim()) return;
    startTransition(async () => {
      const result = await setAddonFeature(addon.id, featureId, value.trim());
      if (result.responseType === "error") {
        toast({
          title: "Couldn't save the limit",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      setFeatureId("");
      setValue("");
      await load();
      router.refresh();
    });
  };

  const remove = (featureKey: string) => {
    if (!addon) return;
    startTransition(async () => {
      const result = await removeAddonFeature(addon.id, featureKey);
      if (result.responseType === "error") {
        toast({
          title: "Couldn't remove the limit",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      await load();
      router.refresh();
    });
  };

  const numericValue = Number(value);
  const invalid =
    value.trim() !== "" && (!Number.isFinite(numericValue) || numericValue < 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Limits lifted by {addon?.name ?? "addon"}</DialogTitle>
          <DialogDescription>
            Enter the <strong>new ceiling</strong>, not the increase. A staff addon that
            takes a 10-staff package to 20 stores <strong>20</strong>. The highest value
            across the package and its active addons wins, so an addon set below the
            package&apos;s own limit changes nothing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {bindings === null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : bindings.length === 0 ? (
            <p className="rounded-lg border border-warn/30 bg-warn-tint px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
              This addon lifts nothing yet — customers would be charged for it and get no
              extra capacity. Add a limit below.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line">
              {bindings.map((b) => (
                <div
                  key={b.feature.featureKey}
                  className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {b.feature.name}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {b.feature.featureKey}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                      {b.featureValue ?? "—"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-neg-tint hover:text-neg"
                      disabled={isPending}
                      aria-label={`Remove ${b.feature.name}`}
                      onClick={() => remove(b.feature.featureKey)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadError && (
            <p className="text-[11.5px] text-neg">{loadError}</p>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[190px] flex-1">
              <label className="mb-1.5 block text-[11.5px] text-muted-foreground">
                Feature
              </label>
              <Select
                value={featureId}
                onValueChange={setFeatureId}
                disabled={isPending || limitFeatures.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a limit" />
                </SelectTrigger>
                <SelectContent>
                  {limitFeatures.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]">
              <label className="mb-1.5 block text-[11.5px] text-muted-foreground">
                New ceiling
              </label>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="20"
                disabled={isPending}
              />
            </div>
            <Button
              onClick={save}
              disabled={isPending || !featureId || !value.trim() || invalid}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save
            </Button>
          </div>

          {invalid && (
            <p className="text-[11.5px] text-neg">
              Enter a whole number of 0 or more.
            </p>
          )}
          {limitFeatures.length === 0 && (
            <p className="text-[11.5px] text-muted-foreground">
              No LIMIT-type features exist yet — create one under Features first.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
