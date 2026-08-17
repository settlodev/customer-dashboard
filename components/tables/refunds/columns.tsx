"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { StatusTag } from "@/components/layouts/order-detail";
import {
  fmtQuantity,
  fmtRefundAmount,
  refundReasonLabel,
  refundReasonTone,
  refundTypeLabel,
} from "@/types/reports/refunds";
import { RefundReportRow } from "@/types/refunds/type";

/**
 * Columns for a list of refund lines (`RefundReportDto` rows from
 * `/refunds/details`). Shared by the `/refunds` list page and the refunds
 * dashboard's detail section — same rows, same endpoint, so one column set.
 *
 * <p>Styled like the orders table: mono order numbers, right-aligned tabular
 * money, and tinted tags for the categorical fields.
 */

// `dateStyle`/`timeStyle` together insert a locale connector whose wording
// differs between the Node and browser ICU builds and trips hydration —
// format the parts explicitly. Same guard as the order detail view.
const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const Dim = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted-2">{children}</span>
);

export const refundColumns: ColumnDef<RefundReportRow>[] = [
  {
    accessorKey: "refundDate",
    header: "Refunded",
    enableHiding: false,
    cell: ({ row }) => {
      const raw = row.original.refundDate ?? row.original.businessDate;
      if (!raw) return <Dim>—</Dim>;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return <Dim>—</Dim>;
      return (
        <div className="whitespace-nowrap">
          <div className="text-[13px] text-ink">{DATE_FMT.format(date)}</div>
          {row.original.refundDate && (
            <div className="font-mono text-[10.5px] text-muted-2">
              {TIME_FMT.format(date)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "orderNumber",
    header: "Order #",
    enableHiding: false,
    cell: ({ row }) => {
      const { orderNumber, orderId } = row.original;
      if (!orderNumber) return <Dim>—</Dim>;
      // Row click goes to the refund; the order number is the escape hatch
      // back to the sale it came from, so it gets its own link.
      return orderId ? (
        <Link
          href={`/orders/${orderId}`}
          className="font-mono text-[12px] text-primary-dark hover:underline dark:text-primary"
        >
          {orderNumber}
        </Link>
      ) : (
        <span className="font-mono text-[12px]">{orderNumber}</span>
      );
    },
  },
  {
    accessorKey: "orderItemName",
    header: "Item",
    enableHiding: false,
    cell: ({ row }) => (
      <span className="font-medium text-ink">
        {row.original.orderItemName ?? <Dim>Unnamed item</Dim>}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQuantity(row.original.quantity)}</span>
    ),
  },
  {
    accessorKey: "refundNetAmount",
    header: "Refunded",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-ink">
        {fmtRefundAmount(row.original.refundNetAmount)}
      </span>
    ),
  },
  {
    accessorKey: "returnedCost",
    header: "Cost back",
    cell: ({ row }) =>
      row.original.returnedCost == null ? (
        <Dim>—</Dim>
      ) : (
        <span className="font-mono tabular-nums text-muted-foreground">
          {fmtRefundAmount(row.original.returnedCost)}
        </span>
      ),
  },
  {
    accessorKey: "reasonType",
    header: "Reason",
    cell: ({ row }) => {
      const { reasonType, reason } = row.original;
      if (!reasonType && !reason) return <Dim>—</Dim>;
      return (
        <div className="flex flex-col items-start gap-1">
          {reasonType && (
            <StatusTag tone={refundReasonTone(reasonType)}>
              {refundReasonLabel(reasonType)}
            </StatusTag>
          )}
          {reason && (
            <span
              className="max-w-[22ch] truncate text-[11.5px] text-muted-foreground"
              title={reason}
            >
              {reason}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "refundType",
    header: "Type",
    cell: ({ row }) =>
      row.original.refundType ? (
        <span className="text-[12.5px]">
          {refundTypeLabel(row.original.refundType)}
        </span>
      ) : (
        <Dim>—</Dim>
      ),
  },
  {
    accessorKey: "refundedByName",
    header: "Refunded by",
    cell: ({ row }) => row.original.refundedByName ?? <Dim>—</Dim>,
  },
  {
    accessorKey: "approvedByName",
    header: "Approved by",
    cell: ({ row }) => row.original.approvedByName ?? <Dim>—</Dim>,
  },
  {
    accessorKey: "stockReturned",
    header: "Stock",
    cell: ({ row }) =>
      row.original.stockReturned ? (
        <StatusTag tone="pos">Restocked</StatusTag>
      ) : (
        <StatusTag tone="warn">Written off</StatusTag>
      ),
  },
];
