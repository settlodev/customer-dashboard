"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Store as StoreIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "./cell-action";
import { Store } from "@/types/store/type";
import Link from "next/link";

type EnrichedStore = Store & {
  subscriptionActive?: boolean;
  hasPendingInvoice?: boolean;
};

export const columns: ColumnDef<EnrichedStore>[] = [
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
        Store Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center flex-shrink-0">
          <StoreIcon className="h-4 w-4 text-violet-500" />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
            {row.original.name}
          </span>
          {row.original.code && (
            <span className="text-xs text-muted-foreground">{row.original.code}</span>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {(row.original as any).locationName || "\u2014"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const store = row.original;
      const subscriptionActive = store.subscriptionActive;
      const hasPendingInvoice = store.hasPendingInvoice;

      // No subscription item → Pending Activation
      if (subscriptionActive === false) {
        return (
          <Link href={`/stores/${store.id}`}>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 cursor-pointer hover:bg-amber-100">
              Pending Activation
            </span>
          </Link>
        );
      }

      // Has subscription but pending invoice → Payment Due
      if (hasPendingInvoice) {
        return (
          <Link href={`/stores/${store.id}`}>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 cursor-pointer hover:bg-blue-100">
              Payment Due
            </span>
          </Link>
        );
      }

      // Active and paid
      if (!store.active) {
        return (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Inactive
          </span>
        );
      }

      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
          Active
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
