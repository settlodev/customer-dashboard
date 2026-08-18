"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Lock, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { UNIT_TYPE_OPTIONS } from "@/types/catalogue/enums";
import type { UnitOfMeasure } from "@/types/unit/type";

const UNIT_TYPE_LABELS = Object.fromEntries(
  UNIT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

export const columns: ColumnDef<UnitOfMeasure>[] = [
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
        Unit
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar
            name={u.name}
            seed={u.id}
            overrideInitials={u.abbreviation.slice(0, 3).toUpperCase()}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">
                {u.name}
              </span>
              {u.systemGenerated && (
                <Badge variant="soft" className="shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  System
                </Badge>
              )}
            </div>
            <div className="mt-0.5 truncate font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground">
              {u.abbreviation}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "unitType",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Type</span>,
    cell: ({ row }) => (
      <div className="hidden md:block">
        <Badge variant="soft">
          {UNIT_TYPE_LABELS[row.original.unitType] ?? row.original.unitType}
        </Badge>
      </div>
    ),
  },
  {
    id: "ownership",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Ownership</span>,
    cell: ({ row }) =>
      row.original.systemGenerated ? (
        <Badge variant="soft" className="hidden lg:inline-flex">
          <Lock className="h-3 w-3" />
          Read-only
        </Badge>
      ) : (
        <Badge variant="pos" className="hidden lg:inline-flex">
          Custom
        </Badge>
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
];
