"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/product/cell-action";
import { Product } from "@/types/product/type";
import Image from "next/image";

export const columns: ColumnDef<Product>[] = [
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
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const image = row.original.imageUrl;
      const isValidImageUrl =
        image &&
        (image.startsWith("http://") ||
          image.startsWith("https://") ||
          image.startsWith("/"));

      const categoryName = row.original.categories?.[0]?.name;

      return (
        <div className="flex items-center gap-3 min-w-0">
          {isValidImageUrl ? (
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
              <Package className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block truncate">
              {row.original.name}
            </span>
            {categoryName && (
              <span className="text-xs text-muted-foreground block truncate">
                {categoryName}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "departmentName",
    enableHiding: true,
    header: () => <div className="hidden lg:block">Department</div>,
    cell: ({ row }) => (
      <div className="hidden lg:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.departmentName || "\u2014"}
        </span>
      </div>
    ),
  },
  {
    id: "price",
    header: () => <div className="hidden md:block">Price</div>,
    enableHiding: true,
    cell: ({ row }) => {
      const firstVariant = row.original.variants?.[0];
      return (
        <div className="hidden md:block">
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {firstVariant
              ? `${firstVariant.price.toLocaleString()} ${firstVariant.nativeCurrency}`
              : "\u2014"}
          </span>
        </div>
      );
    },
  },
  {
    id: "variants",
    header: () => <div className="hidden md:block">Variants</div>,
    enableHiding: true,
    cell: ({ row }) => (
      <div className="hidden md:block">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.variants?.length ?? 0}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = row.original.active;
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
    size: 40,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CellAction data={row.original} />
      </div>
    ),
  },
];
