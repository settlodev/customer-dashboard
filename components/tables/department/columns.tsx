"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Component } from "lucide-react";

import { CellAction } from "@/components/tables/department/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Department } from "@/types/department/type";
import { StateColumn } from "../state-column";
import Image from "next/image";

export const columns: ColumnDef<Department>[] = [
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
    accessorKey: "image",
    header: "Image",
    enableHiding: false,
    cell: ({ row }) => {
        const image = row.original.image;

        // Check if image is a valid URL or path
        const isValidImageUrl = image &&
            (image.startsWith('http://') ||
                image.startsWith('https://') ||
                image.startsWith('/'));

        return isValidImageUrl ? (
            <Image
                src={image}
                alt={row.original.name}
                className="w-10 h-10 rounded-lg"
                width={50}
                height={50}
                loading="lazy"
            />
        ) : (
            // Fallback for invalid and missing images
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Component className="w-6 h-6 text-white" />
            </div>
        );
    }
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
          Department Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
