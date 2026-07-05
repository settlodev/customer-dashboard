"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import SupplierRefundForm from "@/components/forms/supplier_refund_form";
import type { SupplierRefund } from "@/types/supplier-refund/type";

export const columns: ColumnDef<SupplierRefund>[] = [
  {
    accessorKey: "refundNumber",
    enableHiding: false,
    header: "Refund #",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
        {row.original.refundNumber}
      </span>
    ),
  },
  {
    accessorKey: "returnNumber",
    header: "Return",
    cell: ({ row }) => (
      <Link
        href={`/supplier-returns/${row.original.returnId}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.returnNumber}
      </Link>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Owed</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {row.original.amount.toLocaleString()} {row.original.currencyCode}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <RecordAction refund={row.original} />,
  },
];

function RecordAction({ refund }: { refund: SupplierRefund }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Record refund
      </Button>
      <SupplierRefundForm refund={refund} open={open} onOpenChange={setOpen} />
    </>
  );
}
