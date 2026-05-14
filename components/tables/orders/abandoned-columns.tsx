"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Order,
  ORDER_TYPE_LABELS,
  OrderType,
} from "@/types/orders/type";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("en", {
      timeStyle: "short",
      hour12: false,
    }).format(date),
  };
};

const REASON_TYPE_LABEL: Record<string, string> = {
  CUSTOMER_REQUEST: "Customer request",
  OUT_OF_STOCK: "Out of stock",
  KITCHEN_ISSUE: "Kitchen issue",
  PAYMENT_FAILED: "Payment failed",
  DUPLICATE: "Duplicate",
  FRAUD: "Fraud",
  STAFF_ERROR: "Staff error",
  OTHER: "Other",
};

export const abandonedColumns: ColumnDef<Order>[] = [
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
  {
    accessorKey: "orderNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const number = row.original.orderNumber;
      const docket = row.original.docketNumber;
      return (
        <div className="flex flex-col">
          <span className="font-medium tabular-nums">{number}</span>
          {docket ? (
            <span className="text-[11px] text-muted-foreground">
              Docket #{docket}
            </span>
          ) : null}
        </div>
      );
    },
  },
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
      const parts = formatDateTime(row.original.openedDate);
      if (!parts) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span>{parts.date}</span>
          <span className="text-[11px] text-muted-foreground">
            {parts.time}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "closedDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Abandoned
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.closedDate);
      if (!parts) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span>{parts.date}</span>
          <span className="text-[11px] text-muted-foreground">
            {parts.time}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "orderType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.orderType as OrderType | null;
      if (!type) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant="outline" className="font-normal">
          {ORDER_TYPE_LABELS[type] ?? type}
        </Badge>
      );
    },
  },
  {
    id: "table",
    header: "Table",
    cell: ({ row }) => {
      const tableId = row.original.tableId;
      if (!tableId) return <span className="text-muted-foreground">—</span>;
      // The list payload only carries the table UUID; surface a short
      // tag so cashiers can still spot table-claim abandonments.
      return (
        <span className="font-mono text-[11px] text-muted-foreground">
          {String(tableId).slice(0, 8)}
        </span>
      );
    },
  },
  {
    accessorKey: "cancellationReasonType",
    header: "Reason",
    cell: ({ row }) => {
      const order = row.original;
      const type = order.cancellationReasonType;
      const reason = order.cancellationReason;
      const typeLabel = type ? REASON_TYPE_LABEL[type] ?? type : null;
      if (!typeLabel && !reason) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex max-w-[260px] flex-col">
          {typeLabel && (
            <Badge variant="outline" className="w-fit font-normal">
              {typeLabel}
            </Badge>
          )}
          {reason && (
            <span
              className="mt-1 truncate text-[11px] text-muted-foreground"
              title={reason}
            >
              {reason}
            </span>
          )}
        </div>
      );
    },
  },
];
