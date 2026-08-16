"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StockMovement, MOVEMENT_TYPE_LABELS } from "@/types/stock-movement/type";
import { Money } from "@/components/widgets/money";
import { formatDivisibleQuantity } from "@/lib/format-divisible-quantity";

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  SALE: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  TRANSFER_IN: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  TRANSFER_OUT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  RETURN: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  ADJUSTMENT: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  DAMAGE: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  RECIPE_USAGE: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  OPENING_BALANCE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  WASTE: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

export const columns: ColumnDef<StockMovement>[] = [
  {
    accessorKey: "movementType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.movementType;
      const colors = TYPE_COLORS[type] || "bg-muted text-ink-2";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
          {MOVEMENT_TYPE_LABELS[type] || type}
        </span>
      );
    },
  },
  {
    accessorKey: "variantName",
    header: "Stock Item",
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">
          {row.original.variantName}
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
        <span className={`font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {isPositive ? "+" : ""}
          {formatDivisibleQuantity(qty, {
            baseUnitName: row.original.unitName ?? "",
            divisibleUnitRatio: row.original.divisibleUnitRatio,
            divisibleUnitName: row.original.divisibleUnitName,
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => (
      <Money
        amount={row.original.unitCost}
        currency={row.original.currency}
        className="text-ink-2"
      />
    ),
  },
  {
    accessorKey: "totalCost",
    header: "Total Cost",
    cell: ({ row }) => (
      <Money
        amount={row.original.totalCost}
        currency={row.original.currency}
        className="font-medium text-ink-2"
      />
    ),
  },
  {
    accessorKey: "occurredAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-ink-2">
        {new Date(row.original.occurredAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
