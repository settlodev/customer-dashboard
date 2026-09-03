"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import { useToast } from "@/hooks/use-toast";

import { listPackages, reprovisionSubscriptionItem } from "@/lib/actions/admin/billing";
import { PackageResponse, SubscriptionItemResponse } from "@/types/admin/billing";

interface ReprovisionItemDialogProps {
  businessId: string;
  /** The CANCELLED/VOIDED item to reprovision a fresh replacement for. Null closes the dialog. */
  item: SubscriptionItemResponse | null;
  /** entityId -> location/warehouse/store name (billing doesn't own these). */
  entityNames: Record<string, string>;
  onOpenChange: (open: boolean) => void;
  onReprovisioned: () => void;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function ReprovisionItemDialog({
  businessId,
  item,
  entityNames,
  onOpenChange,
  onReprovisioned,
}: ReprovisionItemDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [packages, setPackages] = useState<PackageResponse[] | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string>("");
  const { toast } = useToast();

  const open = !!item;

  useEffect(() => {
    if (!item) {
      setError("");
      setPackages(null);
      setPackageId("");
      return;
    }
    let cancelled = false;
    setLoadingPackages(true);
    setPackagesError(null);
    listPackages(item.entityType)
      .then((list) => {
        if (cancelled) return;
        const active = list.filter((p) => p.isActive);
        setPackages(active);
        // Default to the item's own last package if it's still active — the common case
        // (nothing about the package changed, only the entity's billing state).
        setPackageId(active.some((p) => p.id === item.packageInfo?.id) ? item.packageInfo!.id : "");
      })
      .catch((err: any) => {
        if (cancelled) return;
        setPackagesError(err?.message ?? "Failed to load packages.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!item) return null;

  const entityName = entityNames[item.entityId] ?? `${item.entityType} ${item.entityId}`;

  const onSubmit = () => {
    setError("");
    startTransition(async () => {
      // packageId "" means the item's old package is gone — the select forces a real
      // choice (Radix reserves "" for "cleared"), so this only fires if nothing's selectable.
      const result = await reprovisionSubscriptionItem(businessId, item.id, packageId || null);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Entity reprovisioned", description: result.message });
      onReprovisioned();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Reprovision entity</DialogTitle>
          <DialogDescription>
            Creates a fresh subscription item for this entity with a new trial and
            activation invoice. The {item.status.toLowerCase()} item itself is left
            untouched — this doesn&apos;t undo whatever voided or cancelled it.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}
        {packagesError && <FormError message={packagesError} />}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-muted/30 p-3">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-ink">{entityName}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {item.entityType} · was {item.packageInfo?.name ?? "no package"}
              </p>
            </div>
            <SubscriptionItemStatusBadge status={item.status} small />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-ink">Package</label>
            <Select value={packageId} onValueChange={setPackageId} disabled={isPending || loadingPackages}>
              <SelectTrigger>
                <SelectValue placeholder={loadingPackages ? "Loading…" : "Pick a package"} />
              </SelectTrigger>
              <SelectContent>
                {(packages ?? []).map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} · {formatMoney(pkg.basePrice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingPackages && packages?.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                No active packages for {item.entityType.toLowerCase()}s.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending || loadingPackages || !packageId}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reprovisioning…
              </span>
            ) : (
              "Reprovision"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
