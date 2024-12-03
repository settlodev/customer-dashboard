"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/reservation/cell-action";
import { StateColumn } from "@/components/tables/state-column";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Reservation } from "@/types/reservation/type";

export const columns: ColumnDef<Reservation>[] = [
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
          Name of Reserver
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email address",
  },
  {
    accessorKey: "numberOfPeople",
    header: "No of Guest",
  },
  {
    accessorKey: "date",
    header: "Reservation Date",
    cell: ({ row }) => {
      const date = row.original.date;
      const format = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date))
      return <div>{format}</div>
    }
  },
  {
    accessorKey: "productName",
    header: "Room",
  },
  {
    accessorKey: "startDate",
    header: "Date In",
    cell: ({ row }) => {
      const date = row.original.startDate;
      const format = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date))
      return <div>{format}</div>
    }
  },
  {
    accessorKey: "endDate",
    header: "Date Out",
    cell: ({ row }) => {
      const date = row.original.endDate;
      const format = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date))
      return <div>{format}</div>
    }
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
