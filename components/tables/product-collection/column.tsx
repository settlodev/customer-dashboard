"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FolderOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "./cell-action";
import { ProductCollection } from "@/types/product-collection/type";
import Image from "next/image";

export const columns: ColumnDef<ProductCollection>[] = [
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
        Collection
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const image = row.original.imageUrl;
      const isValidImage =
        image && (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/"));

      return (
        <div className="flex items-center gap-3 min-w-0">
          {isValidImage ? (
            <Image
              src={image}
              alt={row.original.name}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              width={32}
              height={32}
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
              {row.original.name}
            </span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground block truncate">
                {row.original.description}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "productCount",
    header: "Products",
    enableHiding: true,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.productCount}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = !row.original.archivedAt;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {isActive ? "Active" : "Archived"}
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
