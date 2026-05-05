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
    cell: ({ row }) => {
      // A rule is "unattached" when no open (effectiveTo == null) attachment
      // points it at a product variant or modifier option. Surface it as a
      // badge so orphans don't get forgotten in the catalogue.
      const hasOpenAttachment = (row.original.attachments ?? []).some(
        (a) => !a.effectiveTo,
      );
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
            <Beaker className="h-4 w-4 text-orange-500" />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">
              {row.original.name}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {row.original.revisionNumber}
              </span>
              {!hasOpenAttachment && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  Unattached
                </span>
              )}
            </div>
          </div>
        </div>
      );
    },
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
      <span className="text-gray-600 dark:text-gray-400">
        {row.original.items?.filter((i) => !!i.itemCategory).length ?? 0}
      </span>
    ),
  },
  {
    id: "outputs",
    header: "Outputs",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-gray-600 dark:text-gray-400">
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
        return <span className="text-muted-foreground italic">not calculated</span>;
      }
      return (
        <span className="text-gray-700 dark:text-gray-300 tabular-nums">
          {v.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      );
    },
  },
  {
    id: "earliestAttachment",
    header: "Earliest attached",
    enableHiding: true,
    cell: ({ row }) => {
      // Effective dates moved onto attachments. The list shows the rule's
      // earliest open attachment as a coarse "in-use since" hint.
      const earliest = (row.original.attachments ?? [])
        .filter((a) => !a.effectiveTo)
        .map((a) => a.effectiveFrom)
        .sort()[0];
      return (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {earliest ? format(new Date(earliest), "yyyy-MM-dd") : "—"}
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
