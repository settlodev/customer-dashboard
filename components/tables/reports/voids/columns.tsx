"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoidEvent } from "@/lib/orders/void-events";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

const formatNum = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
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

const TYPE_META: Record<
  VoidEvent["kind"],
  { label: string; pill: string; tone: string }
> = {
  ITEM_VOID: {
    label: "Item void",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    tone: "text-amber-700 dark:text-amber-400",
  },
  ORDER_CANCEL: {
    label: "Cancelled",
    pill: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    tone: "text-red-700 dark:text-red-400",
  },
};

export const voidEventColumns: ColumnDef<VoidEvent>[] = [
  {
    accessorKey: "occurredAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        When
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.occurredAt);
      if (!parts) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span>{parts.date}</span>
          <span className="text-[11px] text-muted-foreground">{parts.time}</span>
        </div>
      );
    },
  },
  {
    id: "kind",
    header: "Type",
    cell: ({ row }) => {
      const meta = TYPE_META[row.original.kind];
      return (
        <Badge variant="outline" className={meta.pill}>
          {meta.label}
        </Badge>
      );
    },
  },
  {
    // accessorKey orderNumber so the DataTable search box (searchKey) resolves;
    // the page does the real, multi-field filtering server-side.
    accessorKey: "orderNumber",
    enableHiding: false,
    header: "Item / order",
    cell: ({ row }) => {
      const e = row.original;
      if (e.kind === "ITEM_VOID") {
        const qty = formatNum(e.quantity);
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink">
              {qty ? `${qty}× ` : ""}
              {e.itemName ?? "Item"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground tabular-nums">
              #{e.orderNumber}
              {e.tableName ? ` · ${e.tableName}` : ""}
            </span>
          </div>
        );
      }
      const secondary =
        e.tableName ??
        (e.itemCount != null
          ? `${e.itemCount} item${e.itemCount === 1 ? "" : "s"}`
          : "Whole order");
      return (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium tabular-nums text-ink">
            #{e.orderNumber}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {secondary}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "reasonLabel",
    header: "Reason",
    cell: ({ row }) => {
      const label = row.original.reasonLabel;
      if (!label || label === "—")
        return <span className="text-muted-foreground">—</span>;
      return <span className="text-[12.5px]">{label}</span>;
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
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const e = row.original;
      const meta = TYPE_META[e.kind];
      return (
        <div className="flex flex-col items-end tabular-nums text-[12.5px]">
          <span className={cn("font-medium", meta.tone)}>
            {e.amount > 0 ? `−${formatMoney(e.amount)}` : formatMoney(e.amount)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {e.kind === "ITEM_VOID" ? "item" : "order net"}
          </span>
        </div>
      );
    },
  },
];
