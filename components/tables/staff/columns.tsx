"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/staff/cell-action";
import { Staff } from "@/types/staff";

export const columns: ColumnDef<Staff>[] = [
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
    accessorKey: "firstName",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0 font-semibold"
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Staff Member
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const first = row.original.firstName;
      const last = row.original.lastName;
      const jobTitle = row.original.jobTitle;
      return (
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
            {first} {last}
          </span>
          {jobTitle && (
            <span className="text-xs text-muted-foreground block truncate">
              {jobTitle}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "roleName",
    enableHiding: true,
    header: "Role",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {(row.original as any).roleName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "departmentName",
    enableHiding: true,
    header: () => (
      <div className="hidden lg:block">Department</div>
    ),
    cell: ({ row }) => (
      <div className="hidden lg:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {(row.original as any).departmentName || "—"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    enableHiding: true,
    header: () => (
      <div className="hidden md:block">Phone</div>
    ),
    cell: ({ row }) => (
      <div className="hidden md:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.phone || "—"}
        </span>
      </div>
    ),
  },
  {
    id: "access",
    header: () => (
      <div className="hidden lg:block">Access</div>
    ),
    enableHiding: true,
    cell: ({ row }) => {
      const pos = row.original.posAccess;
      const dashboard = row.original.dashboardAccess;
      return (
        <div className="hidden lg:flex items-center gap-1.5">
          {pos && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              POS
            </span>
          )}
          {dashboard && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
              Dashboard
            </span>
          )}
          {!pos && !dashboard && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "loyaltyPoints",
    header: () => <div className="text-center">Points</div>,
    enableHiding: true,
    cell: ({ row }) => {
      const points = row.original.loyaltyPoints;
      if (points == null || points === 0)
        return <div className="text-center"><span className="text-muted-foreground text-xs">0</span></div>;
      return (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs font-mono">
            {points.toLocaleString()}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = row.original.status;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
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
