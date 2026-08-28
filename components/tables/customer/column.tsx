"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types/customer/type";
import { CellAction } from "@/components/tables/customer/cell-action";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { cn } from "@/lib/utils";

/**
 * Region is optional and most accounts never fill it in, so the column is
 * built only when at least one customer at the location carries one — an
 * all-dashes column would just be noise.
 *
 * Deliberately NOT exported: this module is `"use client"`, so a server
 * component importing a function from it gets a client reference it cannot
 * call. The two ready-made arrays below are what the page picks between.
 */
function buildCustomerColumns({
  showRegion = false,
}: { showRegion?: boolean } = {}): ColumnDef<Customer>[] {
  const cols: ColumnDef<Customer>[] = [
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
      id: "orders",
      enableHiding: true,
      header: () => <span className="hidden lg:inline">Orders</span>,
      cell: ({ row }) => {
        const count = row.original.orderCount ?? 0;
        return (
          <div className="hidden lg:block">
            <span
              className={cn(
                "font-mono text-[12px] tabular-nums",
                count > 0 ? "text-ink" : "text-muted-foreground",
              )}
            >
              {count > 0 ? count.toLocaleString() : "—"}
            </span>
          </div>
        );
      },
    },
    {
      id: "lifetimeValue",
      enableHiding: true,
      header: () => (
        <span className="hidden text-right lg:block">Lifetime value</span>
      ),
      cell: ({ row }) => {
        const value = row.original.lifetimeValue ?? 0;
        if (value <= 0) {
          return (
            <div className="hidden text-right font-mono text-[12px] text-muted-foreground lg:block">
              —
            </div>
          );
        }
        return (
          <div className="hidden text-right font-mono text-[12px] font-medium tabular-nums text-ink lg:block">
            {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        );
      },
    },
    {
      id: "credit",
      enableHiding: true,
      header: () => <span className="hidden text-right xl:block">Credit</span>,
      cell: ({ row }) => {
        // Prepaid money the business still holds on this customer's behalf.
        const bal = row.original.prepaidBalance ?? 0;
        if (bal <= 0) {
          return (
            <div className="hidden text-right font-mono text-[12px] text-muted-foreground xl:block">
              —
            </div>
          );
        }
        return (
          <div className="hidden text-right font-mono text-[12px] font-medium tabular-nums text-pos xl:block">
            {bal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        );
      },
    },
    {
      id: "debt",
      enableHiding: true,
      header: () => <span className="block text-right">Debt</span>,
      cell: ({ row }) => {
        const due = row.original.totalDue ?? 0;
        // Only debtors get a figure. A 0 for everyone else would turn the
        // column into noise and bury the customers actually worth chasing.
        if (due <= 0) {
          return (
            <div className="text-right font-mono text-[12px] text-muted-foreground">
              —
            </div>
          );
        }
        return (
          <div className="text-right font-mono text-[12px] font-medium tabular-nums text-neg">
            {due.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

  if (showRegion) {
    // Sits next to Group — both say who the customer is, which keeps the
    // money columns together on the right.
    const groupIndex = cols.findIndex((c) => c.id === "group");
    cols.splice(groupIndex + 1, 0, {
      id: "region",
      enableHiding: true,
      header: () => <span className="hidden lg:inline">Region</span>,
      cell: ({ row }) => {
        const region = row.original.region;
        if (!region) {
          return (
            <span className="hidden text-muted-foreground lg:inline">—</span>
          );
        }
        return (
          <div className="hidden lg:block">
            <span className="truncate text-[12px] text-ink">{region}</span>
          </div>
        );
      },
    });
  }

  return cols;
}

/** Default column set. */
export const columns: ColumnDef<Customer>[] = buildCustomerColumns();

/** Same set plus the Region column, for locations that record one. */
export const columnsWithRegion: ColumnDef<Customer>[] = buildCustomerColumns({
  showRegion: true,
});
