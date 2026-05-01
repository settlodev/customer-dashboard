"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/department/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { Department } from "@/types/department/type";

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
        Department
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex min-w-[240px] items-center gap-3">
        <TableAvatar
          name={row.original.name}
          imageUrl={row.original.image}
          seed={row.original.id}
        />
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-ink">
            {row.original.name}
          </span>
          {row.original.isDefault && (
            <Badge variant="soft" className="shrink-0">
              Default
            </Badge>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "active",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const isActive = row.original.active;
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
