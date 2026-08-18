"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  listWhitelabelAddonPrices,
  listWhitelabelPackagePrices,
  removeWhitelabelAddonPrice,
  removeWhitelabelPackagePrice,
  setWhitelabelAddonPrice,
  setWhitelabelPackagePrice,
} from "@/lib/actions/admin/billing";
import {
  AddonResponse,
  PackageResponse,
  WhitelabelAddonPriceOverride,
  WhitelabelPackagePriceOverride,
  WhitelabelSummary,
} from "@/types/admin/billing";

interface WhitelabelPricingViewProps {
  whitelabels: WhitelabelSummary[];
  packages: PackageResponse[];
  addons: AddonResponse[];
  initialWhitelabelId: string | null;
}

type Tab = "packages" | "addons";

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function WhitelabelPricingView({
  whitelabels,
  packages,
  addons,
  initialWhitelabelId,
}: WhitelabelPricingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [whitelabelId, setWhitelabelId] = useState<string | null>(
    initialWhitelabelId,
  );
  const [tab, setTab] = useState<Tab>("packages");

  // Keep ?whitelabelId= in the URL so refreshing or sharing the link
  // lands the user on the same whitelabel they were configuring.
  useEffect(() => {
    if (!whitelabelId) return;
    if (searchParams.get("whitelabelId") === whitelabelId) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("whitelabelId", whitelabelId);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whitelabelId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="wl-picker"
            className="block text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Whitelabel
          </label>
          <Select
            value={whitelabelId ?? ""}
            onValueChange={(v) => setWhitelabelId(v || null)}
          >
            <SelectTrigger
              id="wl-picker"
              className="h-9 w-[300px] text-[12.5px]"
            >
              <SelectValue placeholder="Pick a whitelabel" />
            </SelectTrigger>
            <SelectContent>
              {whitelabels.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}{" "}
                  <span className="font-mono text-[11px] text-muted-foreground">
                    · {w.code}
                  </span>
                  {!w.active ? " (off)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          role="tablist"
          className="inline-flex items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
        >
          {(["packages", "addons"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors capitalize",
                tab === t
                  ? "bg-canvas text-ink"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!whitelabelId ? (
        <div className="rounded-xl border border-line bg-card p-6 text-center text-sm text-muted-foreground">
          Pick a whitelabel to view and edit per-tenant pricing.
        </div>
      ) : tab === "packages" ? (
        <PackagePricingTable
          whitelabelId={whitelabelId}
          packages={packages}
          toast={toast}
        />
      ) : (
        <AddonPricingTable
          whitelabelId={whitelabelId}
          addons={addons}
          toast={toast}
        />
      )}
    </div>
  );
}

// ── Package overrides ───────────────────────────────────────────────

interface PackagePricingTableProps {
  whitelabelId: string;
  packages: PackageResponse[];
  toast: ReturnType<typeof useToast>["toast"];
}

function PackagePricingTable({
  whitelabelId,
  packages,
  toast,
}: PackagePricingTableProps) {
  const [overrides, setOverrides] = useState<WhitelabelPackagePriceOverride[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const overrideByPackageId = useMemo(() => {
    const map = new Map<string, WhitelabelPackagePriceOverride>();
    overrides.forEach((o) => o.packageId && map.set(o.packageId, o));
    return map;
  }, [overrides]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listWhitelabelPackagePrices(whitelabelId)
      .then((data) => {
        setOverrides(data);
        // Seed drafts from existing overrides so the inputs reflect
        // current state instead of base prices.
        const next: Record<string, string> = {};
        data.forEach((o) => {
          if (o.packageId) next[o.packageId] = String(o.basePrice);
        });
        setDrafts(next);
      })
      .catch((err: any) =>
        setError(err?.message ?? "Failed to load overrides."),
      )
      .finally(() => setLoading(false));
  }, [whitelabelId]);

  const handleSave = (pkg: PackageResponse) => {
    const raw = drafts[pkg.id];
    const value = raw === undefined ? pkg.basePrice : Number(raw);
    if (Number.isNaN(value) || value < 0) {
      toast({
        title: "Invalid price",
        description: "Enter a non-negative number.",
        variant: "destructive",
      });
      return;
    }
    setBusyId(pkg.id);
    startTransition(async () => {
      const result = await setWhitelabelPackagePrice(whitelabelId, {
        packageId: pkg.id,
        price: value,
      });
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to save",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      if (result.data) {
        setOverrides((prev) => {
          const next = prev.filter((o) => o.packageId !== pkg.id);
          return [...next, result.data!];
        });
      }
    });
  };

  const handleReset = (pkg: PackageResponse) => {
    if (
      !confirm(
        `Remove the override for "${pkg.name}"? Customers on this whitelabel will fall back to the base price (${formatMoney(pkg.basePrice)}).`,
      )
    ) {
      return;
    }
    setBusyId(pkg.id);
    startTransition(async () => {
      const result = await removeWhitelabelPackagePrice(whitelabelId, pkg.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to reset",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      setOverrides((prev) => prev.filter((o) => o.packageId !== pkg.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[pkg.id];
        return next;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-line bg-card p-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading overrides…
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Base price</TableHead>
            <TableHead className="w-[200px]">Override</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[160px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No packages defined yet.
              </TableCell>
            </TableRow>
          ) : (
            packages.map((pkg) => {
              const override = overrideByPackageId.get(pkg.id);
              const draftRaw = drafts[pkg.id];
              const draftValue =
                draftRaw === undefined
                  ? override?.basePrice ?? pkg.basePrice
                  : Number(draftRaw);
              const dirty =
                !Number.isNaN(draftValue) &&
                ((override == null && draftValue !== pkg.basePrice) ||
                  (override != null && draftValue !== override.basePrice));
              return (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {pkg.name}
                    </p>
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {pkg.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {pkg.entityType}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMoney(pkg.basePrice)}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 w-[160px] text-[12.5px]"
                      value={
                        draftRaw ??
                        String(override?.basePrice ?? pkg.basePrice)
                      }
                      onChange={(e) =>
                        setDrafts((p) => ({
                          ...p,
                          [pkg.id]: e.target.value,
                        }))
                      }
                      disabled={isPending && busyId === pkg.id}
                    />
                  </TableCell>
                  <TableCell>
                    {override ? (
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
                      >
                        Overridden
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted bg-muted text-muted-foreground"
                      >
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(pkg)}
                        disabled={
                          !dirty || (isPending && busyId === pkg.id)
                        }
                      >
                        {isPending && busyId === pkg.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReset(pkg)}
                        disabled={!override || (isPending && busyId === pkg.id)}
                        className="text-muted-foreground hover:text-ink"
                        aria-label="Reset to base price"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Addon overrides ─────────────────────────────────────────────────

interface AddonPricingTableProps {
  whitelabelId: string;
  addons: AddonResponse[];
  toast: ReturnType<typeof useToast>["toast"];
}

function AddonPricingTable({
  whitelabelId,
  addons,
  toast,
}: AddonPricingTableProps) {
  const [overrides, setOverrides] = useState<WhitelabelAddonPriceOverride[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const overrideByAddonId = useMemo(() => {
    const map = new Map<string, WhitelabelAddonPriceOverride>();
    overrides.forEach((o) => o.addonId && map.set(o.addonId, o));
    return map;
  }, [overrides]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listWhitelabelAddonPrices(whitelabelId)
      .then((data) => {
        setOverrides(data);
        const next: Record<string, string> = {};
        data.forEach((o) => {
          if (o.addonId) next[o.addonId] = String(o.price);
        });
        setDrafts(next);
      })
      .catch((err: any) =>
        setError(err?.message ?? "Failed to load overrides."),
      )
      .finally(() => setLoading(false));
  }, [whitelabelId]);

  const handleSave = (addon: AddonResponse) => {
    const raw = drafts[addon.id];
    const value = raw === undefined ? addon.price : Number(raw);
    if (Number.isNaN(value) || value < 0) {
      toast({
        title: "Invalid price",
        description: "Enter a non-negative number.",
        variant: "destructive",
      });
      return;
    }
    setBusyId(addon.id);
    startTransition(async () => {
      const result = await setWhitelabelAddonPrice(whitelabelId, {
        addonId: addon.id,
        price: value,
      });
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to save",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      if (result.data) {
        setOverrides((prev) => {
          const next = prev.filter((o) => o.addonId !== addon.id);
          return [...next, result.data!];
        });
      }
    });
  };

  const handleReset = (addon: AddonResponse) => {
    if (
      !confirm(
        `Remove the override for "${addon.name}"? Customers on this whitelabel will fall back to the base price (${formatMoney(addon.price)}).`,
      )
    ) {
      return;
    }
    setBusyId(addon.id);
    startTransition(async () => {
      const result = await removeWhitelabelAddonPrice(whitelabelId, addon.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to reset",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      setOverrides((prev) => prev.filter((o) => o.addonId !== addon.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[addon.id];
        return next;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-line bg-card p-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading overrides…
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Addon</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Base price</TableHead>
            <TableHead className="w-[200px]">Override</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[160px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addons.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No addons defined yet.
              </TableCell>
            </TableRow>
          ) : (
            addons.map((addon) => {
              const override = overrideByAddonId.get(addon.id);
              const draftRaw = drafts[addon.id];
              const draftValue =
                draftRaw === undefined
                  ? override?.price ?? addon.price
                  : Number(draftRaw);
              const dirty =
                !Number.isNaN(draftValue) &&
                ((override == null && draftValue !== addon.price) ||
                  (override != null && draftValue !== override.price));
              return (
                <TableRow key={addon.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {addon.name}
                    </p>
                    {addon.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {addon.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {addon.entityType}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMoney(addon.price)}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 w-[160px] text-[12.5px]"
                      value={
                        draftRaw ?? String(override?.price ?? addon.price)
                      }
                      onChange={(e) =>
                        setDrafts((p) => ({
                          ...p,
                          [addon.id]: e.target.value,
                        }))
                      }
                      disabled={isPending && busyId === addon.id}
                    />
                  </TableCell>
                  <TableCell>
                    {override ? (
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
                      >
                        Overridden
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted bg-muted text-muted-foreground"
                      >
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(addon)}
                        disabled={
                          !dirty || (isPending && busyId === addon.id)
                        }
                      >
                        {isPending && busyId === addon.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReset(addon)}
                        disabled={!override || (isPending && busyId === addon.id)}
                        className="text-muted-foreground hover:text-ink"
                        aria-label="Reset to base price"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
