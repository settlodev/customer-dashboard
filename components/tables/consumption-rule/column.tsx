"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Beaker } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "./cell-action";
import { ConsumptionRule, CONSUMPTION_TYPE_LABELS } from "@/types/consumption-rule/type";

export const columns: ColumnDef<ConsumptionRule>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-4">
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        Rule Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
          <Beaker className="h-4 w-4 text-orange-500" />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
            {row.original.name}
          </span>
          <span className="text-xs text-muted-foreground">
            v{row.original.ruleVersion}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "consumptionType",
    header: "Type",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
        {CONSUMPTION_TYPE_LABELS[row.original.consumptionType] || row.original.consumptionType}
      </span>
    ),
  },
  {
    id: "ingredients",
    header: "Ingredients",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.items?.length ?? 0}
      </span>
    ),
  },
  {
    id: "yield",
    header: "Yield",
    enableHiding: true,
    cell: ({ row }) => {
      const qty = row.original.yieldQuantity;
      const unit = row.original.yieldUnitName;
      if (!qty) return <span className="text-sm text-gray-400">&mdash;</span>;
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {qty} {unit || ""}
        </span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => null,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CellAction data={row.original} />
      </div>
    ),
  },
];
