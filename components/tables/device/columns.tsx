"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { Device } from "@/types/device/type";
import { CellAction } from "@/components/tables/device/cell-action";

export const columns: ColumnDef<Device>[] = [
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
    accessorKey: "customName",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Custom Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "name",
    header: "Brand",
    enableHiding: false,
    cell: ({ row }) => {
      const name = row.original.name;
      return <span>{name ? name : "None"}</span>;
    },
  },

  {
    accessorKey: "model",
    header: "Model",
    enableHiding: false,
    cell: ({ row }) => {
      const model = row.original.model;
      return <span>{model ? model : "None"}</span>;
    },
  },
  {
    id: "serialNumber",
    accessorKey: "Serial Number",
    enableHiding: false,
    cell: ({ row }) => {
      const serial = row.original.serialNumber;
      return <span>{serial ? serial : "None"}</span>;
    },
  },

  // {
  //   id: "operatingSystem",
  //   accessorKey: "Operating System",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const os = row.original.operatingSystem;
  //     return <span>{os ? os : "None"}</span>;
  //   },
  // },

  // {
  //   accessorKey: "operatingSystemVersion",
  //   header: "OS Version",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const version = row.original.operatingSystemVersion;
  //     return <span>{version ? version : "None"}</span>;
  //   },
  // },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
