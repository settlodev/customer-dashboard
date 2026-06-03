"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PILL,
  OrderStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_PILL,
  PaymentStatus,
} from "@/types/orders/type";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

export interface OrdersColumnOptions {
  /**
   * Location runs a table-based ordering system (orderingMode ===
   * "TABLE_MANAGEMENT"). When true the primary column leads with the
   * table name and tucks the order number underneath; when false the
   * pairing is inverted (order number leads, table underneath).
   */
  tableMode: boolean;
  /** staffId → display name, scoped to the IDs on the visible page. */
  staffNames: Record<string, string>;
  /** tableId → table name, scoped to the IDs on the visible page. */
  tableNames: Record<string, string>;
}

export const StaffCell = ({
  id,
  staffNames,
}: {
  id: string | null;
  staffNames: Record<string, string>;
}) => {
  const name = id ? staffNames[id] : null;
  if (!name) return <span className="text-muted-foreground">—</span>;
  return <span className="text-[12.5px]">{name}</span>;
};

/**
 * The lead column shared by the Orders and Abandoned tables. In table
 * mode the table name reads as the primary handle with the order number
 * tucked underneath; standard mode inverts that (order number leads,
 * table name — or docket # — underneath). Keeps the accessorKey as
 * orderNumber so the DataTable search box (searchKey="orderNumber") and
 * order-number sorting keep working regardless of what the cell renders.
 */
export function buildPrimaryColumn({
  tableMode,
  tableNames,
}: {
  tableMode: boolean;
  tableNames: Record<string, string>;
}): ColumnDef<Order> {
  return {
    accessorKey: "orderNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {tableMode ? "Table" : "Order #"}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const order = row.original;
      const number = order.orderNumber;
      const docket = order.docketNumber;
      const tableName = order.tableId ? tableNames[order.tableId] : null;

      if (tableMode) {
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {tableName ?? (
                <span className="text-muted-foreground">No table</span>
              )}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              #{number}
            </span>
          </div>
        );
      }

      const secondary = tableName
        ? tableName
        : docket
          ? `Docket #${docket}`
          : null;
      return (
        <div className="flex flex-col">
          <span className="font-medium tabular-nums">{number}</span>
          {secondary ? (
            <span className="text-[11px] text-muted-foreground">
              {secondary}
            </span>
          ) : null}
        </div>
      );
    },
  };
}

export function buildOrdersColumns({
  tableMode,
  staffNames,
  tableNames,
}: OrdersColumnOptions): ColumnDef<Order>[] {
  return [
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
    },
    buildPrimaryColumn({ tableMode, tableNames }),
    {
      accessorKey: "openedDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Opened
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const opened = row.original.openedDate;
        if (!opened) return <span className="text-muted-foreground">—</span>;
        const date = new Date(opened);
        const dateStr = new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
        }).format(date);
        const timeStr = new Intl.DateTimeFormat("en", {
          timeStyle: "short",
          hour12: false,
        }).format(date);
        return (
          <div className="flex flex-col">
            <span>{dateStr}</span>
            <span className="text-[11px] text-muted-foreground">{timeStr}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned to",
      cell: ({ row }) => (
        <StaffCell id={row.original.assignedTo} staffNames={staffNames} />
      ),
    },
    {
      accessorKey: "finishedBy",
      header: "Closed by",
      cell: ({ row }) => (
        <StaffCell id={row.original.finishedBy} staffNames={staffNames} />
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid / Unpaid",
      cell: ({ row }) => {
        const paid = row.original.paidAmount ?? 0;
        const unpaid = row.original.unpaidAmount ?? 0;
        return (
          <div className="flex flex-col tabular-nums text-[12.5px]">
            <span className="text-emerald-700 dark:text-emerald-400">
              {formatMoney(paid)}
            </span>
            {unpaid > 0 ? (
              <span className="text-rose-700 dark:text-rose-400">
                −{formatMoney(unpaid)}
              </span>
            ) : (
              <span className="text-muted-foreground">settled</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus as PaymentStatus | null;
        if (!status) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className={PAYMENT_STATUS_PILL[status] ?? ""}>
            {PAYMENT_STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.orderStatus as OrderStatus;
        return (
          <Badge variant="outline" className={ORDER_STATUS_PILL[status] ?? ""}>
            {ORDER_STATUS_LABELS[status] ?? String(status)}
          </Badge>
        );
      },
    },
  ];
}
