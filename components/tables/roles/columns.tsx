"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/roles/cell-action";
import { Role } from "@/types/roles/type";

export const columns: ColumnDef<Role>[] = [
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
        Role Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { name, description } = row.original;
      return (
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">{name}</span>
          {description && (
            <span className="text-xs text-muted-foreground block truncate">{description}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "scope",
    header: "Scope",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 capitalize">
        {row.original.scope.toLowerCase()}
      </span>
    ),
  },
  {
    id: "permissions",
    header: "Permissions",
    enableHiding: true,
    cell: ({ row }) => {
      const count = row.original.permissionCount ?? row.original.permissionKeys?.length ?? 0;
      return (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {count} {count === 1 ? "permission" : "permissions"}
        </span>
      );
    },
  },
  {
    id: "type",
    header: () => <div className="hidden lg:block">Type</div>,
    enableHiding: true,
    cell: ({ row }) => (
      <div className="hidden lg:block">
        {row.original.system ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            System
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            Custom
          </span>
        )}
      </div>
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
