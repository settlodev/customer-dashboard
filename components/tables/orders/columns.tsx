"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, RotateCcw, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/format-datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PILL,
  OrderStatus,
  orderRefundBadge,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_PILL,
  PaymentStatus,
  REFUND_PILL,
} from "@/types/orders/type";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

export interface OrdersColumnOptions {
  /**
   * Location runs a table-based ordering system (orderingMode ===
   * "TABLE_MANAGEMENT"). When true the table name outranks the order
   * number in the primary column; when false the pairing is inverted
   * (order number leads, table underneath). An order the cashier named
   * outranks both either way — see {@link buildPrimaryColumn}.
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
 * The lead column shared by the Orders and Abandoned tables.
 *
 * <p>Three handles can identify an order and the operator may know it by
 * any of them, so all three render — the ranking decides which one is the
 * heading and which are the fine print underneath:
 *
 * <pre>
 *   order name  →  table name  →  order number      (table mode)
 *   order name  →  order number  →  table name      (standard mode)
 * </pre>
 *
 * The name leads whenever the cashier gave one, because a name is chosen
 * to be recognised and neither of the others is. Below it, the existing
 * table-mode swap is untouched: a location running tables knows an order
 * by where it is sitting, everyone else by its number. Docket # stands in
 * for the table when there is no table.
 *
 * A customer attached at the till is not a handle — it says who the order
 * was for, not which order it is — so it does not join the ranking. It
 * renders as its own marked line under the handles instead of earning a
 * column, which would sit empty on the walk-in rows that make up most of
 * the list; a row with no customer pays nothing for it.
 *
 * Keeps the accessorKey as orderNumber so the DataTable search box
 * (searchKey="orderNumber") and order-number sorting keep working
 * regardless of what the cell renders.
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
      const orderName = order.orderName?.trim() || null;
      const customer = order.customerName?.trim() || null;

      // Everything that identifies this order, most-recognisable first.
      // Whichever survives to the front becomes the heading; the rest
      // stay on as the sub-line, so nothing the operator might be
      // searching by disappears.
      const handles: string[] = [];
      if (orderName) handles.push(orderName);
      if (tableMode) {
        if (tableName) handles.push(tableName);
        handles.push(`#${number}`);
      } else {
        handles.push(`#${number}`);
        if (tableName) handles.push(tableName);
        else if (docket) handles.push(`Docket #${docket}`);
      }

      const [lead, ...rest] = handles;
      // Table mode with no table and no name: the old cell said "No table"
      // rather than silently leading with the number, and that absence is
      // worth seeing on a floor that works by table.
      const missingTable = tableMode && !tableName && !orderName;

      return (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-medium",
              lead.startsWith("#") && "tabular-nums",
            )}
          >
            {lead}
          </span>
          {missingTable ? (
            <span className="text-[11px] text-muted-foreground">No table</span>
          ) : null}
          {rest.length > 0 ? (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {rest.join(" · ")}
            </span>
          ) : null}
          {customer ? (
            <span
              className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"
              title={`Customer: ${customer}`}
            >
              <UserRound className="h-3 w-3 shrink-0" aria-hidden />
              <span className="sr-only">Customer </span>
              <span className="max-w-[200px] truncate">{customer}</span>
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
        const dateStr = formatDate(row.original.openedDate);
        if (!dateStr) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col">
            <span>{dateStr}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatTime(row.original.openedDate)}
            </span>
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
        const order = row.original;
        const status = order.orderStatus as OrderStatus;
        // Money going back out is a different fact from how the order ended —
        // a refunded order is still CLOSED — so it rides under the status pill
        // as its own marker rather than replacing it or earning a column of
        // its own, which would sit empty on almost every row.
        const refund = orderRefundBadge(order);
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="outline" className={ORDER_STATUS_PILL[status] ?? ""}>
              {ORDER_STATUS_LABELS[status] ?? String(status)}
            </Badge>
            {refund ? (
              <Badge
                variant="outline"
                className={REFUND_PILL[refund.full ? "full" : "partial"]}
                title={`${refund.label}: ${formatMoney(order.refundedAmount)}`}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                {refund.label}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
  ];
}
