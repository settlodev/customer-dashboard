"use client";

import React from "react";
import {
  Building2,
  Warehouse,
  Store,
  MoreHorizontal,
  ArrowLeftRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusPill, toPillTone } from "./pill";
import {
  ENTITY_TYPE_LABEL as ENTITY_LABEL,
  formatBillingDate,
  getSubscriptionItemStatusMeta,
} from "./shared";
import type { Subscription, SubscriptionItem, EntityType } from "@/types/billing/types";

interface ItemsTableProps {
  subscription: Subscription;
  /** Map of entityId → human label. Used to show "Bar Hill HQ" instead of a raw UUID. */
  entityLabels?: Record<string, string>;
  /** Disable mutation actions while a parent dialog is open or a refresh is in flight. */
  disabled?: boolean;
  onChangePlan: (item: SubscriptionItem) => void;
  onManageAddons: (item: SubscriptionItem) => void;
  /** Cancel this one entity, leaving the rest of the subscription billing. */
  onCancelItem: (item: SubscriptionItem) => void;
}

const ENTITY_ICON: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  LOCATION: Building2,
  WAREHOUSE: Warehouse,
  STORE: Store,
};

export function ItemsTable({
  subscription,
  entityLabels,
  disabled,
  onChangePlan,
  onManageAddons,
  onCancelItem,
}: ItemsTableProps) {
  // Source from manageableItems (ACTIVE + degraded) so an owner can re-pick a plan on a
  // lapsed entity before paying to reactivate. Falls back to items on pre-deploy responses.
  const activeItems = (subscription.manageableItems ?? subscription.items).filter(
    (item) => item.status !== "REMOVED" && item.status !== "CANCELLED",
  );

  // Cancelling the only separately-billed entity would leave a subscription with
  // nothing on it — that's "cancel the subscription", which lives in the danger
  // zone and handles access/refund properly. Send them there instead.
  const isLastBillableItem = activeItems.filter((item) => !item.isBundled).length <= 1;

  if (activeItems.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No active subscription items on this account.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(20,17,12,0.03)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-11 px-5 w-[30%]">Subscribed entity</TableHead>
            <TableHead className="h-11 px-5 w-[20%]">Plan</TableHead>
            <TableHead className="h-11 px-5 w-[16%]">Addons</TableHead>
            <TableHead className="h-11 px-5 w-[14%]">Status</TableHead>
            <TableHead className="h-11 px-5">Added</TableHead>
            <TableHead className="h-11 px-5 w-[72px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeItems.map((item) => {
            const Icon = ENTITY_ICON[item.entityType] ?? Building2;
            const label = entityLabels?.[item.entityId];
            const statusMeta = getSubscriptionItemStatusMeta(item.status);
            const isOnTrial =
              item.status === "ACTIVE" &&
              item.trialEndDate !== null &&
              new Date(item.trialEndDate) > new Date();
            return (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[10px] border border-line bg-canvas text-ink-3">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                        {label ?? `${ENTITY_LABEL[item.entityType]} ${item.entityId.slice(0, 8)}`}
                      </p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                        {ENTITY_LABEL[item.entityType]}
                        {item.isBundled && " · bundled"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4">
                  {item.packageInfo ? (
                    <>
                      <span className="inline-flex items-center rounded-[7px] border border-line bg-canvas px-2.5 py-1 text-[12.5px] font-semibold tracking-[-0.01em] text-ink-2">
                        {item.packageInfo.name}
                      </span>
                      <p className="mt-1.5 font-mono text-[11px] text-muted-2">
                        v{item.packageVersion}
                      </p>
                    </>
                  ) : (
                    <StatusPill tone="warn">No plan attached</StatusPill>
                  )}
                </TableCell>
                <TableCell className="px-5 py-4">
                  {item.addons.length === 0 ? (
                    <span className="font-mono text-muted-2">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {item.addons.map((addon) => (
                        <span
                          key={addon.id}
                          className="inline-flex items-center gap-1 rounded-[7px] bg-pos-tint px-2 py-1 text-[11.5px] font-medium text-pos"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {addon.name}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={toPillTone(statusMeta.variant)}>
                      {statusMeta.label}
                    </StatusPill>
                    {isOnTrial && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-ink-3">
                        <Sparkles className="h-2.5 w-2.5" />
                        Trial
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 font-mono text-[13px] text-ink-3">
                  {formatBillingDate(item.addedAt)}
                </TableCell>
                <TableCell className="px-5 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8 rounded-lg text-muted-foreground hover:bg-canvas hover:text-ink"
                        disabled={
                          disabled ||
                          item.isBundled ||
                          item.status === "CANCELLED" ||
                          item.status === "REMOVED"
                        }
                        aria-label="Item actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Manage {ENTITY_LABEL[item.entityType].toLowerCase()}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* Change plan stays available on lapsed/expired units so the owner can
                          re-pick a package before paying to reactivate. */}
                      <DropdownMenuItem onSelect={() => onChangePlan(item)}>
                        <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                        Change plan
                      </DropdownMenuItem>
                      {/* Add-on proration only applies to a paid, active cycle. */}
                      <DropdownMenuItem
                        onSelect={() => onManageAddons(item)}
                        disabled={item.status !== "ACTIVE"}
                      >
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Manage addons
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onCancelItem(item)}
                        disabled={isLastBillableItem}
                        title={
                          isLastBillableItem
                            ? "This is your only billed entity — use Cancel subscription instead."
                            : undefined
                        }
                        className="text-neg focus:bg-neg-tint focus:text-neg"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Cancel {ENTITY_LABEL[item.entityType].toLowerCase()}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
