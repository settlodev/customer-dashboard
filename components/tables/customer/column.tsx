"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Customer, CUSTOMER_SOURCE_LABELS } from "@/types/customer/type";
import { CustomerSource } from "@/types/enums";
import { CellAction } from "@/components/tables/customer/cell-action";

export const columns: ColumnDef<Customer>[] = [
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
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
          {row.original.firstName} {row.original.lastName}
        </span>
        {row.original.customerAccountNumber && (
          <span className="text-xs text-muted-foreground block truncate font-mono">
            {row.original.customerAccountNumber}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    enableHiding: true,
    header: () => <div className="hidden md:block">Phone</div>,
    cell: ({ row }) => (
      <div className="hidden md:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.phoneNumber || "—"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    enableHiding: true,
    header: () => <div className="hidden lg:block">Email</div>,
    cell: ({ row }) => (
      <div className="hidden lg:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.email || "—"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "customerGroupName",
    enableHiding: true,
    header: () => <div className="hidden lg:block">Group</div>,
    cell: ({ row }) => (
      <div className="hidden lg:block">
        {row.original.customerGroupName ? (
          <Badge variant="secondary" className="text-xs">
            {row.original.customerGroupName}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "source",
    enableHiding: true,
    header: () => <div className="hidden lg:block">Source</div>,
    cell: ({ row }) => {
      const source = row.original.source as CustomerSource | null;
      return (
        <div className="hidden lg:block">
          {source ? (
            <Badge variant="outline" className="text-xs">
              {CUSTOMER_SOURCE_LABELS[source]}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "loyaltyPoints",
    enableHiding: true,
    header: () => <div className="text-center">Points</div>,
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
    accessorKey: "totalOrders",
    enableHiding: true,
    header: () => <div className="text-center">Orders</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.totalOrders ?? 0}
        </span>
      </div>
    ),
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
