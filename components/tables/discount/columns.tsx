"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/discount/cell-action";
import { Discount } from "@/types/discount/type";
import { DISCOUNT_RULE_TYPE_OPTIONS, DISCOUNT_APPLY_MODE_OPTIONS } from "@/types/discount/enums";

function ruleTypeLabel(value: Discount["ruleType"]): string {
  return DISCOUNT_RULE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function applyModeLabel(value: Discount["applyMode"]): string {
  return DISCOUNT_APPLY_MODE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function formatValue(discount: Discount): string {
  if (discount.ruleType === "PERCENTAGE") return `${discount.value}%`;
  if (discount.ruleType === "FIXED_AMOUNT") return discount.value.toLocaleString();
  if (discount.ruleType === "BUY_X_GET_Y") {
    return `Buy ${discount.buyQuantity ?? "?"} get ${discount.getQuantity ?? "?"}`;
  }
  if (discount.ruleType === "TIERED") return `${discount.tiers.length} tier${discount.tiers.length === 1 ? "" : "s"}`;
  return String(discount.value);
}

export const columns: ColumnDef<Discount>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-ink"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Discount
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex min-w-[220px] flex-col">
        <span className="truncate text-[13px] font-medium text-ink">
          {row.original.name}
        </span>
        {row.original.couponCode && (
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {row.original.couponCode}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "ruleType",
    accessorKey: "ruleType",
    header: "Rule",
    cell: ({ row }) => (
      <Badge variant="soft">{ruleTypeLabel(row.original.ruleType)}</Badge>
    ),
  },
  {
    id: "value",
    header: "Value",
    cell: ({ row }) => (
      <span className="text-[13px] text-ink-2">{formatValue(row.original)}</span>
    ),
  },
  {
    id: "applyMode",
    accessorKey: "applyMode",
    header: "Apply mode",
    cell: ({ row }) => (
      <span className="text-[13px] text-ink-2">
        {applyModeLabel(row.original.applyMode)}
      </span>
    ),
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <span className="font-mono text-[12px] text-muted-foreground">
        {row.original.priority}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "active",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = row.original.active;
      return (
        <Badge variant={isActive ? "pos" : "soft"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => null,
    size: 40,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CellAction data={row.original} />
      </div>
    ),
  },
];
