"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { ProductCollection } from "@/types/product-collection/type";

const formatMoney = (amount: number, currency: string | null | undefined) => {
  const ccy = currency ?? "TZS";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fall back gracefully when an unsupported ISO code slips through.
    return `${ccy} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)}`;
  }
};

export const columns: ColumnDef<ProductCollection>[] = [
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
    size: 32,
  },
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-ink"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Bundle
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex min-w-[240px] items-center gap-3">
        <TableAvatar
          name={row.original.name}
          imageUrl={row.original.imageUrl}
          seed={row.original.id}
        />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-ink">
            {row.original.name}
          </div>
          {row.original.description && (
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "itemCount",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Items</span>,
    cell: ({ row }) => (
      <div className="hidden md:block">
        <Badge variant="soft">
          {new Intl.NumberFormat("en-US").format(row.original.itemCount ?? 0)}
        </Badge>
      </div>
    ),
  },
  {
    id: "price",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Bundle price</span>,
    cell: ({ row }) => {
      const { effectivePrice, defaultPrice, customPrice, nativeCurrency } = row.original;
      const overridden = customPrice != null;
      return (
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[13px] font-medium text-ink">
            {formatMoney(effectivePrice ?? 0, nativeCurrency)}
          </span>
          {overridden && (
            <span className="text-[11px] text-muted-foreground">
              {/* Show the would-be sum so merchants can see the discount/premium at a glance. */}
              from {formatMoney(defaultPrice ?? 0, nativeCurrency)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "sellable",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Stock</span>,
    cell: ({ row }) => {
      // Server-side derived: every constituent variant has stock for its
      // required quantity. Empty bundles report unsellable too.
      const sellable = row.original.sellable;
      return (
        <Badge variant={sellable ? "pos" : "soft"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {sellable ? "Sellable" : "Out of stock"}
        </Badge>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isArchived = row.original.archivedAt != null;
      return (
        <Badge variant={isArchived ? "soft" : "pos"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isArchived ? "Archived" : "Active"}
        </Badge>
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
