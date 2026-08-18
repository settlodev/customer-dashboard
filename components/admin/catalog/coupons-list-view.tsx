"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Ticket } from "lucide-react";

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

import { CreateCouponDialog } from "@/components/admin/catalog/create-coupon-dialog";
import { deactivateCoupon } from "@/lib/actions/admin/billing";
import { CouponResponse } from "@/types/admin/billing";

interface CouponsListViewProps {
  coupons: CouponResponse[];
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

function formatValue(c: CouponResponse): string {
  return c.discountType === "PERCENTAGE"
    ? `${c.discountValue}%`
    : c.discountValue.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
}

function isExpired(c: CouponResponse): boolean {
  try {
    return new Date(c.validUntil).getTime() < Date.now();
  } catch {
    return false;
  }
}

export function CouponsListView({ coupons }: CouponsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDeactivate = (c: CouponResponse) => {
    if (
      !confirm(
        `Deactivate "${c.code}"? Customers will no longer be able to redeem it.`,
      )
    ) {
      return;
    }
    setBusyId(c.id);
    startTransition(async () => {
      const result = await deactivateCoupon(c.id);
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

  const active = coupons.filter((c) => c.isActive === true);
  const archived = coupons.filter((c) => c.isActive === false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {active.length} active · {archived.length} deactivated
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New coupon
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No coupons yet. Create one to issue a redeemable code.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => {
                const exhausted =
                  typeof c.maxUses === "number" &&
                  typeof c.currentUses === "number" &&
                  c.currentUses >= c.maxUses;
                const expired = isExpired(c);
                let badge: { label: string; className: string };
                if (c.isActive === false) {
                  badge = {
                    label: "Deactivated",
                    className: "border-muted bg-muted text-muted-foreground",
                  };
                } else if (exhausted) {
                  badge = {
                    label: "Exhausted",
                    className:
                      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
                  };
                } else if (expired) {
                  badge = {
                    label: "Expired",
                    className:
                      "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
                  };
                } else {
                  badge = {
                    label: "Active",
                    className:
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
                  };
                }
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                          <Ticket className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                            {c.code}
                          </p>
                          {c.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatValue(c)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(c.validFrom)} → {formatDate(c.validUntil)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {c.currentUses ?? 0}
                      {c.maxUses ? `/${c.maxUses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${c.code}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.isActive ? (
                            <DropdownMenuItem
                              onSelect={() => handleDeactivate(c)}
                              disabled={isPending && busyId === c.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              disabled
                              className="text-muted-foreground"
                            >
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

      <CreateCouponDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
