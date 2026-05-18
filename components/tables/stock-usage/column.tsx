"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  StockUsage,
  USAGE_CATEGORY_OPTIONS,
} from "@/types/stock-usage/type";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

const sumLineCost = (usage: StockUsage): number =>
  usage.items?.reduce((acc, line) => {
    if (line.unitCost == null) return acc;
    return acc + Number(line.unitCost) * Number(line.quantity);
  }, 0) ?? 0;

const sumLineQuantity = (usage: StockUsage): number =>
  usage.items?.reduce((acc, line) => acc + Number(line.quantity), 0) ?? 0;

export const columns: ColumnDef<StockUsage>[] = [
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
  },
  {
    accessorKey: "usageNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Reference
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
        {row.original.usageNumber}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const label =
        USAGE_CATEGORY_OPTIONS.find((o) => o.value === row.original.category)
          ?.label || row.original.category;
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <span className="text-gray-600 truncate max-w-[220px] block">
        {row.original.purpose}
      </span>
    ),
  },
  {
    accessorKey: "recipientName",
    header: "Recipient",
    cell: ({ row }) => (
      <span className="text-gray-900 font-medium truncate max-w-[160px] block">
        {row.original.recipientName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-gray-600 truncate max-w-[160px] block">
        {row.original.departmentName || "—"}
      </span>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const count = row.original.items?.length ?? 0;
      const qty = sumLineQuantity(row.original);
      return (
        <span className="text-gray-600">
          {count} {count === 1 ? "item" : "items"} · −{qty.toLocaleString()}
        </span>
      );
    },
  },
  {
    id: "totalCost",
    header: "Total cost",
    cell: ({ row }) => {
      const total = sumLineCost(row.original);
      const currency = row.original.currency || DEFAULT_CURRENCY;
      return total > 0 ? (
        <Money amount={total} currency={currency} />
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isReversed = row.original.status === "REVERSED";
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isReversed
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isReversed ? "Reversed" : "Active"}
        </span>
      );
    },
  },
  {
    accessorKey: "usageDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {new Date(row.original.usageDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
