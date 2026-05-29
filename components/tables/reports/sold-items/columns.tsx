"use client";

import Image from "next/image";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MessageSquare,
  Package,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  SOLD_ITEM_STATUS_LABELS,
  SOLD_ITEM_STATUS_PILL,
  type SoldItemLine,
  type SoldItemStatus,
} from "@/types/reports/sold-items";

const formatNum = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("en", {
      timeStyle: "short",
      hour12: false,
    }).format(date),
  };
};

export const soldItemsColumns: ColumnDef<SoldItemLine>[] = [
  {
    accessorKey: "soldAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Sold at
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.soldAt);
      if (!parts) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span>{parts.date}</span>
          <span className="text-[11px] text-muted-foreground">
            {parts.time}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        // data-no-row-click so clicking the order link doesn't also trigger
        // the row's product-detail navigation handler.
        <Link
          href={`/orders/${item.orderId}`}
          data-no-row-click
          className="font-mono text-[12px] font-medium tabular-nums text-ink hover:underline"
        >
          {item.orderNumber}
        </Link>
      );
    },
  },
  {
    accessorKey: "productName",
    enableHiding: false,
    header: "Product",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.productName}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <Package
                className="h-4 w-4 text-muted-2"
                aria-hidden
                strokeWidth={1.5}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink">
              {item.productName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {item.variantName ? (
                <>
                  {item.variantName}
                  {item.categoryName ? ` · ${item.categoryName}` : ""}
                </>
              ) : (
                item.categoryName ?? "Uncategorised"
              )}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original;
      const refunded = item.refundedQuantity ?? 0;
      const voided = item.status === "VOIDED";
      return (
        <div className="flex flex-col tabular-nums">
          <span
            className={cn(
              "font-medium",
              voided && "text-muted-foreground line-through",
            )}
          >
            {formatNum(item.quantity)}
          </span>
          {refunded > 0 && !voided ? (
            <span className="text-[11px] text-rose-600 dark:text-rose-400">
              −{formatNum(refunded)} refunded
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status as SoldItemStatus;
      return (
        <Badge variant="outline" className={SOLD_ITEM_STATUS_PILL[status] ?? ""}>
          {SOLD_ITEM_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: "modifications",
    header: "Modifications",
    cell: ({ row }) => {
      const item = row.original;
      const mods = item.modifierNames ?? [];
      const addons = item.addonNames ?? [];
      const notes = item.specialInstructions?.trim() ?? "";
      const total = mods.length + addons.length + (notes ? 1 : 0);

      if (total === 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              {mods.length > 0 && (
                <Badge variant="outline" className="font-normal">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {mods.length} mod{mods.length === 1 ? "" : "s"}
                </Badge>
              )}
              {addons.length > 0 && (
                <Badge variant="outline" className="font-normal">
                  +{addons.length} add-on{addons.length === 1 ? "" : "s"}
                </Badge>
              )}
              {notes && (
                <Badge variant="outline" className="font-normal">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Notes
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs space-y-2">
            {mods.length > 0 && (
              <div>
                <div className="mb-0.5 text-[10.5px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Modifiers
                </div>
                <div>{mods.join(", ")}</div>
              </div>
            )}
            {addons.length > 0 && (
              <div>
                <div className="mb-0.5 text-[10.5px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Add-ons
                </div>
                <div>{addons.join(", ")}</div>
              </div>
            )}
            {notes && (
              <div>
                <div className="mb-0.5 text-[10.5px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  Notes
                </div>
                <div className="italic">{notes}</div>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "discountName",
    header: "Discount",
    cell: ({ row }) => {
      const name = row.original.discountName;
      if (!name) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 font-normal text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        >
          {name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "staffName",
    header: "Staff",
    cell: ({ row }) => {
      const name = row.original.staffName;
      if (!name) return <span className="text-muted-foreground">—</span>;
      return <span className="text-[12.5px]">{name}</span>;
    },
  },
];
