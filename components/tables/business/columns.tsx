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
    accessorKey: "prefix",
    header: "Prefix",
    enableHiding: false,
  },
  {
    accessorKey: "countryName",
    header: "Country",
    enableHiding: false,
  },
  {
    accessorKey: "totalLocations",
    header: "Total Locations",
    cell: ({ row }) =>
      <div className="flex items-center">
          <div className="rounded-full items-center inline-flex bg-gray-100 text-gray-700 text-md font-bold pl-2 pr-4 pt-1 pb-1 gap-2">
              <span className="text-emerald-500 font-bold px-2">{row.original.totalLocations}</span>
              <span className="mr-0">Location{row.original.totalLocations>1 && 's'}</span>
              <span><ExternalLinkIcon height={14} width={14} /></span>
      </div>
      </div>
  },
  {
    accessorKey: "businessTypeName",
    header: "Business Type",
    enableHiding: false,
  },
  {
    id: "vfdRegistrationState",
    accessorKey: "vfdRegistrationState",
    header: ({ column }) => {
        return (
            <Button
                className="text-left p-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                VFD
            </Button>
        );
    },
    cell: ({ row }) => <StateColumn state={row.original.vfdRegistrationState} />,
    enableHiding: false,
},
{
  id: "status",
  accessorKey: "status",
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
  cell: ({ row }) => <StateColumn state={row.original.status} />,
  enableHiding: false,
},
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
