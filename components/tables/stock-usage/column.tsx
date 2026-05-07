"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StockUsage, STOCK_USAGE_TYPE_OPTIONS } from "@/types/stock-usage/type";

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
    accessorKey: "variantName",
    header: "Stock item",
    cell: ({ row }) => (
      <span className="text-gray-900 font-medium truncate max-w-[220px] block">
        {row.original.variantName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "usageType",
    header: "Usage type",
    cell: ({ row }) => {
      const label =
        STOCK_USAGE_TYPE_OPTIONS.find((o) => o.value === row.original.usageType)
          ?.label || row.original.usageType;
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="font-mono text-gray-900">
        {Number(row.original.quantity).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-gray-600 truncate max-w-[180px] block">
        {row.original.departmentName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "recordedByName",
    header: "Recorded by",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {row.original.recordedByName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
