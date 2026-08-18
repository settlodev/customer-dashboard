"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/table-combination/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { TableCombination } from "@/types/space/type";

export const columns: ColumnDef<TableCombination>[] = [
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
        Combination
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const c = row.original;
      const tableNames = c.tables?.map((t) => t.name).join(" · ") ?? "";
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={c.name} seed={c.id} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {c.name}
            </div>
            {tableNames && (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {tableNames}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Capacity</span>,
    cell: ({ row }) => {
      const cap = row.original.capacity ?? 0;
      return (
        <div className="hidden md:block">
          <Badge variant="soft" className="gap-1 text-[10.5px]">
            <Users className="h-3 w-3" aria-hidden />
            <span className="tabular-nums">{cap.toLocaleString()}</span>
          </Badge>
        </div>
      );
    },
  },
  {
    id: "tables",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Tables</span>,
    cell: ({ row }) => {
      const tables = row.original.tables ?? [];
      if (tables.length === 0) {
        return (
          <span className="hidden text-muted-foreground lg:inline">—</span>
        );
      }
      return (
        <div className="hidden flex-wrap gap-1 lg:flex">
          {tables.slice(0, 4).map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="text-[10.5px] font-normal"
            >
              {t.name}
            </Badge>
          ))}
          {tables.length > 4 && (
            <Badge variant="outline" className="text-[10.5px] font-normal">
              +{tables.length - 4}
            </Badge>
          )}
        </div>
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
