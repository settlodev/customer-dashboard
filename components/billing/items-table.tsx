"use client";

import React from "react";
import { Building2, Warehouse, Store, MoreHorizontal, ArrowLeftRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { formatBillingDate } from "./shared";
import type { Subscription, SubscriptionItem, EntityType } from "@/types/billing/types";

interface ItemsTableProps {
  subscription: Subscription;
  /** Map of entityId → human label. Used to show "Bar Hill HQ" instead of a raw UUID. */
  entityLabels?: Record<string, string>;
  /** Disable mutation actions while a parent dialog is open or a refresh is in flight. */
  disabled?: boolean;
  onChangePlan: (item: SubscriptionItem) => void;
  onManageAddons: (item: SubscriptionItem) => void;
}

const ENTITY_ICON: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  LOCATION: Building2,
  WAREHOUSE: Warehouse,
  STORE: Store,
};

const ENTITY_LABEL: Record<EntityType, string> = {
  LOCATION: "Location",
  WAREHOUSE: "Warehouse",
  STORE: "Store",
};

export function ItemsTable({
  subscription,
  entityLabels,
  disabled,
  onChangePlan,
  onManageAddons,
}: ItemsTableProps) {
  const activeItems = subscription.items.filter((item) => item.status === "ACTIVE");

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
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36%]">Subscribed entity</TableHead>
            <TableHead className="w-[24%]">Plan</TableHead>
            <TableHead className="w-[20%]">Addons</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeItems.map((item) => {
            const Icon = ENTITY_ICON[item.entityType] ?? Building2;
            const label = entityLabels?.[item.entityId];
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md border border-line bg-canvas text-ink-3">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {label ?? `${ENTITY_LABEL[item.entityType]} ${item.entityId.slice(0, 8)}`}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {ENTITY_LABEL[item.entityType]}
                        {item.isBundled && " · bundled"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {item.packageInfo ? (
                    <>
                      <Badge variant="soft" className="font-medium">
                        {item.packageInfo.name}
                      </Badge>
                      <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                        v{item.packageVersion}
                      </p>
                    </>
                  ) : (
                    <Badge variant="warn">No plan attached</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.addons.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.addons.map((addon) => (
                        <Badge key={addon.id} variant="pos" className="gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          {addon.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatBillingDate(item.addedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={disabled || item.isBundled}
                        aria-label="Item actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Manage {ENTITY_LABEL[item.entityType].toLowerCase()}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onChangePlan(item)}>
                        <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                        Change plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onManageAddons(item)}>
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Manage addons
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
