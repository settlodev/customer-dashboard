"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/addon-group/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import type { AddonGroup } from "@/types/product/type";

export const columns: ColumnDef<AddonGroup>[] = [
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
        Addon group
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const itemCount = row.original.items?.length ?? 0;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={row.original.name} seed={row.original.id} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {row.original.name}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "range",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Min–Max</span>,
    cell: ({ row }) => (
      <span className="hidden font-mono tabular-nums text-[12px] text-ink-3 md:inline">
        {row.original.minSelections}–{row.original.maxSelections}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isArchived = row.original.archivedAt != null;
      const isActive = row.original.active && !isArchived;
      if (isArchived) {
        return (
          <Badge variant="soft">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            Archived
          </Badge>
        );
      }
      return (
        <Badge variant={isActive ? "pos" : "soft"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isActive ? "Active" : "Inactive"}
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
