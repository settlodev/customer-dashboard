"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Customer,
  CUSTOMER_SOURCE_LABELS,
} from "@/types/customer/type";
import { CellAction } from "@/components/tables/customer/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "firstName",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-ink"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const c = row.original;
      const fullName = `${c.firstName} ${c.lastName}`;
      return (
        <div className="flex min-w-[240px] items-center gap-3">
          <TableAvatar name={fullName} seed={c.id} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {fullName}
            </div>
            {c.customerAccountNumber && (
              <div className="mt-0.5 truncate font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {c.customerAccountNumber}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "contact",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Contact</span>,
    cell: ({ row }) => {
      const { phoneNumber, email } = row.original;
      if (!phoneNumber && !email) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }
      return (
        <div className="hidden flex-col md:flex">
          {phoneNumber && (
            <span className="font-mono text-[12px] tabular-nums text-ink">
              {phoneNumber}
            </span>
          )}
          {email && (
            <span className="truncate text-[11px] text-muted-foreground">
              {email}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "group",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Group</span>,
    cell: ({ row }) => {
      const name = row.original.customerGroupName;
      if (!name) {
        return (
          <span className="hidden text-muted-foreground lg:inline">—</span>
        );
      }
      return (
        <div className="hidden lg:block">
          <Badge variant="soft" className="text-[10.5px]">
            {name}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "source",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Source</span>,
    cell: ({ row }) => {
      const source = row.original.source;
      if (!source) {
        return (
          <span className="hidden text-muted-foreground lg:inline">—</span>
        );
      }
      return (
        <div className="hidden lg:block">
          <Badge variant="outline" className="text-[10.5px]">
            {CUSTOMER_SOURCE_LABELS[source]}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "loyalty",
    enableHiding: true,
    header: () => <span className="hidden xl:inline">Points</span>,
    cell: ({ row }) => {
      const points = row.original.loyaltyPoints ?? 0;
      const carry = row.original.loyaltyPointsCarryOver ?? 0;
      return (
        <div className="hidden xl:block">
          <div className="font-mono text-[12px] tabular-nums text-ink">
            {points.toLocaleString()}
          </div>
          {carry > 0 && (
            <div className="font-mono text-[10.5px] text-muted-foreground">
              +{carry.toLocaleString()} carry
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "prepaid",
    enableHiding: true,
    header: () => <span className="hidden xl:inline">Prepaid</span>,
    cell: ({ row }) => {
      const bal = row.original.prepaidBalance ?? 0;
      if (bal <= 0) {
        return (
          <span className="hidden font-mono text-[12px] text-muted-foreground xl:inline">
            —
          </span>
        );
      }
      return (
        <div className="hidden xl:block">
          <span className="font-mono text-[12px] tabular-nums text-ink">
            {bal.toLocaleString()}
          </span>
        </div>
      );
    },
  },
  {
    id: "noShow",
    enableHiding: true,
    header: () => <span className="hidden xl:inline">No-shows</span>,
    cell: ({ row }) => {
      const count = row.original.noShowCount ?? 0;
      if (count === 0) {
        return (
          <span className="hidden font-mono text-[12px] text-muted-foreground xl:inline">
            0
          </span>
        );
      }
      return (
        <div className="hidden xl:block">
          <Badge
            variant={count > 2 ? "neg" : "warn"}
            className="text-[10.5px] tabular-nums"
          >
            {count}
          </Badge>
        </div>
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
