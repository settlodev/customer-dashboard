"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

import { CreateDiscountDialog } from "@/components/admin/catalog/create-discount-dialog";
import { deactivateDiscountDefinition } from "@/lib/actions/admin/billing";
import { DiscountResponse } from "@/types/admin/billing";

interface DiscountsListViewProps {
  discounts: DiscountResponse[];
}

function isDiscountActive(d: DiscountResponse): boolean {
  // Server returns `active` on the support endpoint and `isActive` on
  // the admin endpoint — normalise so the badge logic doesn't depend on
  // which path we hit.
  if (typeof d.isActive === "boolean") return d.isActive;
  if (typeof d.active === "boolean") return d.active;
  return true;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatValue(d: DiscountResponse): string {
  return d.discountType === "PERCENTAGE"
    ? `${d.discountValue}%`
    : d.discountValue.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
}

export function DiscountsListView({ discounts }: DiscountsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDeactivate = (d: DiscountResponse) => {
    if (
      !confirm(
        `Deactivate "${d.name}"? Existing subscriptions keep the discount but no new applications can be made.`,
      )
    ) {
      return;
    }
    setBusyId(d.id);
    startTransition(async () => {
      const result = await deactivateDiscountDefinition(d.id);
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

  const active = discounts.filter(isDiscountActive);
  const archived = discounts.filter((d) => !isDiscountActive(d));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {active.length} active · {archived.length} deactivated
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New discount
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Discount</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No discount definitions yet. Create one to let support apply
                  it later.
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((d) => {
                const live = isDiscountActive(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {d.name}
                          </p>
                          {d.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {d.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatValue(d)}
                      {d.isFreeSubscription ? (
                        <span className="ml-1.5 text-[10.5px] font-mono uppercase text-violet-500">
                          free
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {d.scope}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {d.source.replace("_", " ").toLowerCase()}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(d.validFrom)} → {formatDate(d.validUntil)}
                      {d.durationMonths
                        ? ` · ${d.durationMonths}mo`
                        : ""}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {d.currentApplications ?? 0}
                      {d.maxApplications ? `/${d.maxApplications}` : ""}
                    </TableCell>
                    <TableCell>
                      {live ? (
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
                            aria-label={`Actions for ${d.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {live && (
                            <DropdownMenuItem
                              onSelect={() => handleDeactivate(d)}
                              disabled={isPending && busyId === d.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {!live && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              Already deactivated
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDiscountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
