"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StockMovement, MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: "bg-green-50 text-green-700",
  SALE: "bg-blue-50 text-blue-700",
  TRANSFER_IN: "bg-cyan-50 text-cyan-700",
  TRANSFER_OUT: "bg-indigo-50 text-indigo-700",
  RETURN: "bg-amber-50 text-amber-700",
  ADJUSTMENT: "bg-yellow-50 text-yellow-700",
  DAMAGE: "bg-red-50 text-red-700",
  RECIPE_USAGE: "bg-purple-50 text-purple-700",
  OPENING_BALANCE: "bg-emerald-50 text-emerald-700",
  WASTE: "bg-orange-50 text-orange-700",
};

export const columns: ColumnDef<StockMovement>[] = [
  {
    accessorKey: "movementType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.movementType;
      const colors = TYPE_COLORS[type] || "bg-gray-50 text-gray-700";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
          {MOVEMENT_TYPE_LABELS[type] || type}
        </span>
      );
    },
  },
  {
    accessorKey: "stockVariantName",
    header: "Stock Item",
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
          {row.original.stockVariantName}
        </span>
        <span className="text-xs text-muted-foreground">{row.original.stockName}</span>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const qty = row.original.quantity;
      const isPositive = qty > 0;
      return (
        <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? "+" : ""}{qty.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.unitCost != null ? row.original.unitCost.toLocaleString() : "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "occurredAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {new Date(row.original.occurredAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
