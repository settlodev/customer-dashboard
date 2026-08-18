"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/category/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { SortableHeader } from "@/components/tables/shared/sortable-header";
import { Category } from "@/types/category/type";

export const columns: ColumnDef<Category>[] = [
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
    enableSorting: false,
    header: () => <SortableHeader sortKey="name" label="Category" />,
    cell: ({ row }) => {
      const hasParent = !!row.original.parentName;
      return (
        <div className="flex min-w-[240px] items-center gap-2">
          {hasParent && (
            <CornerDownRight
              className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
              aria-hidden
            />
          )}
          <TableAvatar
            name={row.original.name}
            imageUrl={row.original.imageUrl}
            seed={row.original.id}
          />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {row.original.name}
            </div>
            {hasParent && (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                in {row.original.parentName}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "departmentName",
    enableHiding: true,
    enableSorting: false,
    header: () => (
      <SortableHeader
        sortKey="departmentName"
        label="Department"
        className="hidden md:inline-flex"
      />
    ),
    cell: ({ row }) => {
      const name = row.original.departmentName;
      if (!name) {
        return <span className="hidden text-muted-foreground md:inline">—</span>;
      }
      return (
        <div className="hidden md:block">
          <Badge variant="soft">{name}</Badge>
        </div>
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
