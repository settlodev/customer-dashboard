"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, LayoutGrid } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/floor-plan/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { FloorPlan } from "@/types/space/type";

export const columns: ColumnDef<FloorPlan>[] = [
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
        Floor plan
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const fp = row.original;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={fp.name} seed={fp.id} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">
                {fp.name}
              </span>
              {fp.isDefault && (
                <Badge variant="soft" className="shrink-0 text-[10.5px]">
                  Default
                </Badge>
              )}
            </div>
            {fp.description && (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {fp.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "dimensions",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Dimensions</span>,
    cell: ({ row }) => {
      const { width, height } = row.original;
      if (!width && !height) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }
      return (
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums text-ink">
            <LayoutGrid className="h-3 w-3 text-muted-foreground" aria-hidden />
            {width ?? "—"} × {height ?? "—"}
            <span className="text-[10.5px] text-muted-foreground">px</span>
          </span>
        </div>
      );
    },
  },
  {
    id: "default",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => (
      <Badge variant={row.original.isDefault ? "pos" : "soft"}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {row.original.isDefault ? "Default" : "Available"}
      </Badge>
    ),
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
