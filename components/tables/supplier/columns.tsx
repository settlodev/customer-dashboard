"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import type { Supplier } from "@/types/supplier/type";

export const columns: ColumnDef<Supplier>[] = [
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
        Supplier
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const {
        id,
        name,
        contactPersonName,
        linkedToSettloSupplier,
        settloSupplierName,
      } = row.original;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={name} seed={id} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">
                {name}
              </span>
              {linkedToSettloSupplier && (
                <Badge variant="pos" className="shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Linked
                </Badge>
              )}
            </div>
            {contactPersonName && (
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {contactPersonName}
                {settloSupplierName && linkedToSettloSupplier
                  ? ` · via ${settloSupplierName}`
                  : ""}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Email</span>,
    cell: ({ row }) => (
      <span className="hidden text-[12px] text-ink-3 md:inline">
        {row.original.email || "—"}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Phone</span>,
    cell: ({ row }) => (
      <span className="hidden text-[12px] text-ink-3 md:inline">
        {row.original.phone || row.original.contactPersonPhone || "—"}
      </span>
    ),
  },
  {
    accessorKey: "registrationNumber",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Reg #</span>,
    cell: ({ row }) => (
      <span className="hidden font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground lg:inline">
        {row.original.registrationNumber || "—"}
      </span>
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
