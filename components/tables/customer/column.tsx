"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StateColumn } from "@/components/tables/state-column";
import { Customer, CUSTOMER_SOURCE_LABELS } from "@/types/customer/type";
import { CustomerSource } from "@/types/enums";
import { CellAction } from "@/components/tables/customer/cell-action";

export const columns: ColumnDef<Customer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
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
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        <span className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
        {row.original.customerAccountNumber && (
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.customerAccountNumber}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) =>
      row.original.email || (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
  {
    accessorKey: "customerGroupName",
    header: "Group",
    cell: ({ row }) =>
      row.original.customerGroupName ? (
        <Badge variant="secondary" className="text-xs">
          {row.original.customerGroupName}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.original.source as CustomerSource | null;
      if (!source) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <Badge variant="outline" className="text-xs">
          {CUSTOMER_SOURCE_LABELS[source]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalOrders",
    header: "Orders",
    cell: ({ row }) => row.original.totalOrders ?? 0,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <StateColumn state={row.original.status} />,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
