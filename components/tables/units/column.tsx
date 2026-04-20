"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UNIT_TYPE_OPTIONS } from "@/types/catalogue/enums";
import type { UnitOfMeasure } from "@/types/unit/type";

const UNIT_TYPE_LABELS = Object.fromEntries(
  UNIT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

export const columns: ColumnDef<UnitOfMeasure>[] = [
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-semibold shrink-0">
            {u.abbreviation.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {u.name}
              </span>
              {u.systemGenerated && (
                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <ShieldCheck className="h-3 w-3" />
                  System
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{u.abbreviation}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "unitType",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        {UNIT_TYPE_LABELS[row.original.unitType] ?? row.original.unitType}
      </span>
    ),
  },
  {
    id: "ownership",
    header: "Ownership",
    cell: ({ row }) =>
      row.original.systemGenerated ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Read-only
        </span>
      ) : (
        <span className="text-xs text-emerald-700 dark:text-emerald-400">
          Custom
        </span>
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isArchived = !!row.original.archivedAt;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isArchived
              ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          }`}
        >
          {isArchived ? "Archived" : "Active"}
        </span>
      );
    },
  },
];
