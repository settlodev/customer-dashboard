"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/brand/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { Brand } from "@/types/brand/type";

export const columns: ColumnDef<Brand>[] = [
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
        Brand
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
