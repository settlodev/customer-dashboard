"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  Edit2,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  Save,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { CreditPackFormDialog } from "@/components/admin/catalog/credit-pack-form-dialog";
import {
  deactivateCreditPack,
  listPackageIncludedCredits,
  removePackageIncludedCredit,
  setPackageIncludedCredit,
} from "@/lib/actions/admin/billing";
import {
  CreditPackResponse,
  CreditTypeResponse,
  PackageIncludedCreditResponse,
  PackageResponse,
} from "@/types/admin/billing";

interface CreditPacksViewProps {
  packs: CreditPackResponse[];
  creditTypes: CreditTypeResponse[];
  packages: PackageResponse[];
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CreditPacksView({
  packs,
  creditTypes,
  packages,
}: CreditPacksViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CreditPackResponse | null>(null);

  // Per-package allowance state
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(
    packages.find((p) => p.isActive)?.id ?? null,
  );
  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null;
  const [allowances, setAllowances] = useState<
    PackageIncludedCreditResponse[]
  >([]);
  const [allowancesLoading, setAllowancesLoading] = useState(false);
  const [allowancesError, setAllowancesError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const refreshAllowances = (pkgId: string) => {
    setAllowancesLoading(true);
    setAllowancesError(null);
    listPackageIncludedCredits(pkgId)
      .then((items) => {
        setAllowances(items);
        const next: Record<string, string> = {};
        items.forEach((a) => {
          next[a.creditTypeId] = String(a.monthlyAmount);
        });
        setDrafts(next);
      })
      .catch((err: any) =>
        setAllowancesError(err?.message ?? "Failed to load allowances."),
      )
      .finally(() => setAllowancesLoading(false));
  };

  useEffect(() => {
    if (!selectedPkgId) {
      setAllowances([]);
      setDrafts({});
      return;
    }
    refreshAllowances(selectedPkgId);
  }, [selectedPkgId]);

  const handleNewPack = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEditPack = (p: CreditPackResponse) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleDeactivatePack = (p: CreditPackResponse) => {
    if (
      !confirm(
        `Deactivate "${p.name}"? Existing purchases keep their credits but new sales will be blocked.`,
      )
    ) {
      return;
    }
    setBusyId(p.id);
    startTransition(async () => {
      const result = await deactivateCreditPack(p.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to deactivate",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const handleSaveAllowance = (creditTypeId: string) => {
    if (!selectedPkgId) return;
    const raw = drafts[creditTypeId];
    const value = Number(raw ?? "0");
    if (Number.isNaN(value) || value < 0 || !Number.isInteger(value)) {
      toast({
        title: "Invalid amount",
        description: "Enter a non-negative whole number.",
        variant: "destructive",
      });
      return;
    }
    setBusyId(creditTypeId);
    startTransition(async () => {
      const result = await setPackageIncludedCredit(selectedPkgId, {
        creditTypeId,
        monthlyAmount: value,
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
      refreshAllowances(selectedPkgId);
    });
  };

  const handleRemoveAllowance = (a: PackageIncludedCreditResponse) => {
    if (!selectedPkgId) return;
    if (
      !confirm(
        `Remove the ${a.creditTypeName} allowance from ${selectedPkg?.name}?`,
      )
    ) {
      return;
    }
    setBusyId(a.creditTypeId);
    startTransition(async () => {
      const result = await removePackageIncludedCredit(
        selectedPkgId,
        a.creditTypeId,
      );
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to remove",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      refreshAllowances(selectedPkgId);
    });
  };

  // Allow attaching a brand-new credit type to the package — show every
  // unallocated credit type as a "0 / save" row at the bottom.
  const usedTypeIds = new Set(allowances.map((a) => a.creditTypeId));
  const unusedTypes = creditTypes.filter((ct) => !usedTypeIds.has(ct.id));

  return (
    <div className="space-y-8">
      {/* Credit pack catalog */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Credit packs</h2>
            <p className="font-mono text-[12px] text-muted-foreground">
              Bundles customers buy on demand (top-ups).
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleNewPack}
            disabled={creditTypes.length === 0}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New credit pack
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pack</TableHead>
                <TableHead>Credit type</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {creditTypes.length === 0
                      ? "Define credit types in the database before creating packs."
                      : "No credit packs yet."}
                  </TableCell>
                </TableRow>
              ) : (
                packs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <Coins className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {p.creditTypeName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {p.creditAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(p.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${p.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditPack(p)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleDeactivatePack(p)}
                            disabled={isPending && busyId === p.id}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Per-package included credits */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              Monthly included credits
            </h2>
            <p className="font-mono text-[12px] text-muted-foreground">
              Per-package allowances that grant credits each billing cycle.
            </p>
          </div>
          <div className="ml-auto">
            <Select
              value={selectedPkgId ?? ""}
              onValueChange={(v) => setSelectedPkgId(v || null)}
            >
              <SelectTrigger className="h-9 w-[260px] text-[12.5px]">
                <SelectValue placeholder="Pick a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.entityType.toLowerCase()}
                    {p.isActive ? "" : " (off)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {!selectedPkg ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Pick a package to start.
            </p>
          ) : allowancesError ? (
            <p className="px-4 py-6 text-center text-sm text-destructive">
              {allowancesError}
            </p>
          ) : allowancesLoading ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading allowances…
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit type</TableHead>
                  <TableHead className="w-[180px]">Monthly amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowances.length === 0 && unusedTypes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No credit types available — define them first.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {allowances.map((a) => {
                      const raw = drafts[a.creditTypeId];
                      const value = Number(raw ?? a.monthlyAmount);
                      const dirty =
                        !Number.isNaN(value) && value !== a.monthlyAmount;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {a.creditTypeName ?? a.creditTypeId}
                            </p>
                            {a.creditTypeCode && (
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {a.creditTypeCode}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              className="h-8 w-[140px] text-[12.5px]"
                              value={raw ?? String(a.monthlyAmount)}
                              onChange={(e) =>
                                setDrafts((p) => ({
                                  ...p,
                                  [a.creditTypeId]: e.target.value,
                                }))
                              }
                              disabled={isPending && busyId === a.creditTypeId}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                            >
                              Included
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveAllowance(a.creditTypeId)}
                                disabled={
                                  !dirty ||
                                  (isPending && busyId === a.creditTypeId)
                                }
                              >
                                {isPending && busyId === a.creditTypeId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveAllowance(a)}
                                disabled={
                                  isPending && busyId === a.creditTypeId
                                }
                                className="text-destructive hover:bg-destructive/10"
                                aria-label="Remove allowance"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {unusedTypes.map((ct) => {
                      const raw = drafts[ct.id];
                      const value = Number(raw ?? "0");
                      const valid =
                        !Number.isNaN(value) && value > 0 && Number.isInteger(value);
                      return (
                        <TableRow key={ct.id} className="bg-canvas/40">
                          <TableCell>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {ct.name}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {ct.code}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              placeholder="0"
                              className="h-8 w-[140px] text-[12.5px]"
                              value={raw ?? ""}
                              onChange={(e) =>
                                setDrafts((p) => ({
                                  ...p,
                                  [ct.id]: e.target.value,
                                }))
                              }
                              disabled={isPending && busyId === ct.id}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-muted bg-muted text-muted-foreground"
                            >
                              Not included
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveAllowance(ct.id)}
                              disabled={!valid || (isPending && busyId === ct.id)}
                            >
                              {isPending && busyId === ct.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Add
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <CreditPackFormDialog
        pack={editing}
        creditTypes={creditTypes}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
