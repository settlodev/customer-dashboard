"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Beaker } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "./cell-action";
import { BOM_LIFECYCLE_LABELS, BomLifecycleStatus, BomRule } from "@/types/bom/type";

const statusClass: Record<BomLifecycleStatus, string> = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  DRAFT: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  DEPRECATED: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

export const columns: ColumnDef<BomRule>[] = [
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
        Rule
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
            {row.original.revisionNumber}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "lifecycleStatus",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const s = row.original.lifecycleStatus;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[s]}`}
        >
          {BOM_LIFECYCLE_LABELS[s]}
        </span>
      );
    },
  },
  {
    id: "items",
    header: "Items",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.items?.filter((i) => !!i.itemCategory).length ?? 0}
      </span>
    ),
  },
  {
    id: "outputs",
    header: "Outputs",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.outputs?.length ?? 0}
      </span>
    ),
  },
  {
    id: "baseCost",
    header: "Cached cost",
    enableHiding: true,
    cell: ({ row }) => {
      const v = row.original.baseCostCached;
      if (v === null || v === undefined) {
        return <span className="text-sm text-muted-foreground italic">not calculated</span>;
      }
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
          {v.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      );
    },
  },
  {
    accessorKey: "effectiveFrom",
    header: "Effective from",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {row.original.effectiveFrom
          ? format(new Date(row.original.effectiveFrom), "yyyy-MM-dd")
          : "—"}
      </span>
    ),
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
