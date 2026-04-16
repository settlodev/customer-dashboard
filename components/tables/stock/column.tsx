"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Package, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/stock/cell-action";
import type { StockWithBalance } from "@/types/stock/type";
import { MATERIAL_TYPE_OPTIONS } from "@/types/catalogue/enums";

export const columns: ColumnDef<StockWithBalance>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-4">
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="w-4">
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock Item
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
          <Package className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
            {row.original.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.baseUnitAbbreviation}
            {row.original.variants?.length > 1 &&
              ` · ${row.original.variants.length} variants`}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "materialType",
    header: "Type",
    enableHiding: true,
    cell: ({ row }) => {
      const label =
        MATERIAL_TYPE_OPTIONS.find(
          (o) => o.value === row.original.materialType,
        )?.label || row.original.materialType;
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {label}
        </span>
      );
    },
  },
  {
    id: "quantity",
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Qty on Hand
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => row.totalQuantity,
    enableHiding: true,
    cell: ({ row }) => {
      const qty = row.original.totalQuantity;
      const isLow = row.original.lowStock;
      const isOut = row.original.outOfStock;

      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-medium ${
              isOut
                ? "text-red-600 dark:text-red-400"
                : isLow
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {qty.toLocaleString()}
          </span>
          {(isLow || isOut) && (
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                isOut
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            />
          )}
        </div>
      );
    },
  },
  {
    id: "value",
    header: "Value",
    accessorFn: (row) => row.totalValue,
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.totalValue > 0
          ? row.original.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : "\u2014"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const archived = row.original.archived;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            !archived
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {archived ? "Archived" : "Active"}
        </span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => null,
    cell: ({ row }) => (
      <div className="flex justify-end" data-no-row-click>
        <CellAction data={row.original} />
      </div>
    ),
  },
];
