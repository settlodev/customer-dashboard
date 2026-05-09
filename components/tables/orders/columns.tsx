"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CellAction } from "@/components/tables/orders/cell-action";
import {
  Order,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PILL,
  ORDER_TYPE_LABELS,
  OrderStatus,
  OrderType,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_PILL,
  PaymentStatus,
} from "@/types/orders/type";

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

export const columns: ColumnDef<Order>[] = [
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
    accessorKey: "grossAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Gross
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const order = row.original;
      const currency = order.settlementCurrency ?? "TZS";
      return (
        <div className="flex flex-col tabular-nums">
          <span className="font-medium">{formatMoney(order.grossAmount)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      );
    },
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
        <Badge
          variant="outline"
          className={PAYMENT_STATUS_PILL[status] ?? ""}
        >
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
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
