"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Eye, MoreHorizontal, Package, Plus, Power } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { PackageFormDialog } from "@/components/admin/catalog/package-form-dialog";
import { deactivatePackage } from "@/lib/actions/admin/billing";
import { PackageResponse } from "@/types/admin/billing";

interface PackagesListViewProps {
  packages: PackageResponse[];
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PackagesListView({ packages }: PackagesListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PackageResponse | null>(null);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (pkg: PackageResponse) => {
    setEditing(pkg);
    setFormOpen(true);
  };

  const handleDeactivate = (pkg: PackageResponse) => {
    if (
      !confirm(
        `Deactivate "${pkg.name}"? New subscriptions can no longer pick this package, but existing ones keep running.`,
      )
    ) {
      return;
    }
    setBusyId(pkg.id);
    startTransition(async () => {
      const result = await deactivatePackage(pkg.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to deactivate package",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const active = packages.filter((p) => p.isActive);
  const archived = packages.filter((p) => !p.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {active.length} active · {archived.length} deactivated
        </p>
        <Button size="sm" onClick={handleNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New package
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Base price</TableHead>
              <TableHead>Included</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No packages yet. Create the first one to enable signups.
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow
                  key={pkg.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // Ignore clicks that bubble up from the actions menu
                    // or any nested interactive element so we don't
                    // hijack edit/deactivate.
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest("[role='menuitem']") ||
                      target.closest("a")
                    ) {
                      return;
                    }
                    router.push(`/packages/${pkg.id}`);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <Package className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {pkg.name}
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {pkg.entityType}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMoney(pkg.basePrice)}
                    {/* The interval decides whether this figure is a monthly or an
                        annual charge — the service prices a term as
                        (basePrice ÷ intervalMonths) × termMonths. Legacy rows seeded
                        as YEARLY read 12× cheaper per month than they look, and the
                        edit form can't change the interval, so surface it here. */}
                    <span
                      className={cn(
                        "ml-1 font-mono text-[10.5px] font-normal",
                        pkg.billingInterval === "YEARLY"
                          ? "text-warn"
                          : "text-muted-foreground",
                      )}
                      title={
                        pkg.billingInterval === "YEARLY"
                          ? "Priced per YEAR — this is basePrice ÷ 12 per month. New packages are created MONTHLY."
                          : "Priced per month"
                      }
                    >
                      {pkg.billingInterval === "YEARLY" ? "/yr" : "/mo"}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {pkg.includedWarehouseCount
                      ? `${pkg.includedWarehouseCount} wh`
                      : ""}
                    {pkg.includedWarehouseCount && pkg.includedStoreCount
                      ? " · "
                      : ""}
                    {pkg.includedStoreCount
                      ? `${pkg.includedStoreCount} stores`
                      : ""}
                    {!pkg.includedWarehouseCount && !pkg.includedStoreCount
                      ? "—"
                      : ""}
                  </TableCell>
                  <TableCell>
                    {pkg.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted bg-muted text-muted-foreground"
                      >
                        Deactivated
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${pkg.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/packages/${pkg.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleEdit(pkg)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {pkg.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleDeactivate(pkg)}
                              disabled={isPending && busyId === pkg.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Power className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PackageFormDialog
        pkg={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
