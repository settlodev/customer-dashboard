"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CornerDownRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/category/cell-action";
import { Category } from "@/types/category/type";
import Image from "next/image";

export const columns: ColumnDef<Category>[] = [
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
    accessorKey: "name",
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
          Category Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const image = row.original.imageUrl;
      const name = row.original.name;
      const parentName = row.original.parentName;
      const hasParent = !!parentName;

      const isValidImageUrl =
        image &&
        (image.startsWith("http://") ||
          image.startsWith("https://") ||
          image.startsWith("/"));

      return (
        <div className={`flex items-center gap-3 ${hasParent ? "pl-6" : ""}`}>
          {hasParent && (
            <CornerDownRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0 -ml-6" />
          )}
          {isValidImageUrl && (
            <Image
              src={image}
              alt={name}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
              width={32}
              height={32}
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
              {name}
            </span>
            {hasParent && (
              <span className="text-xs text-muted-foreground block truncate">
                {parentName}
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
    cell: ({ row }) => {
      const count = (row.original as any).productCount ?? 0;
      return (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {new Intl.NumberFormat("en-US").format(count)}
        </span>
      );
    },
  },
  {
    accessorKey: "productVariantsCount",
    header: () => (
      <div className="hidden md:block">Variants</div>
    ),
    enableHiding: true,
    cell: ({ row }) => {
      const count = (row.original as any).productVariantsCount ?? 0;
      return (
        <div className="hidden md:block">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Intl.NumberFormat("en-US").format(count)}
          </span>
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
