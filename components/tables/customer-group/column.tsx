"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/customer-group/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { CustomerGroup } from "@/types/customer/type";

export const columns: ColumnDef<CustomerGroup>[] = [
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
        Group
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const g = row.original;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={g.name} seed={g.id} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {g.name}
            </div>
            {g.description && (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {g.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "customerCount",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Members</span>,
    cell: ({ row }) => {
      const count = row.original.customerCount ?? 0;
      return (
        <div className="hidden md:block">
          <Badge variant="soft" className="gap-1 text-[10.5px]">
            <Users className="h-3 w-3" aria-hidden />
            <span className="tabular-nums">{count.toLocaleString()}</span>
          </Badge>
        </div>
      );
    },
  },
  {
    id: "identifier",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Identifier</span>,
    cell: ({ row }) => {
      const identifier = row.original.identifier;
      if (!identifier) {
        return (
          <span className="hidden text-muted-foreground lg:inline">—</span>
        );
      }
      return (
        <span className="hidden font-mono text-[11px] tracking-[0.02em] text-muted-foreground lg:inline">
          {identifier}
        </span>
      );
    },
  },
  {
    id: "status",
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
