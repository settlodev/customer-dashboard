"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLinkIcon } from "lucide-react";

import { CellAction } from "@/components/tables/business/cell-action";
import { StateColumn } from "@/components/tables/state-column";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Business } from "@/types/business/type";

export const columns: ColumnDef<Business>[] = [
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
    accessorKey: "name",
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
  },
  {
    accessorKey: "countryId",
    header: "Country",
    enableHiding: false,
  },
  {
    accessorKey: "businessTypeName",
    header: "Business Type",
    enableHiding: false,
  },
  {
  id: "active",
  accessorKey: "active",
  header: ({ column }) => {
      return (
          <Button
              className="text-left p-0"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Status
          </Button>
      );
  },
  cell: ({ row }) => <StateColumn state={row.original.active} />,
  enableHiding: false,
},
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
