"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  TransferRequest,
  TRANSFER_REQUEST_STATUS_COLORS,
  getTransferRequestStatusLabel,
} from "@/types/stock-transfer-request/type";

interface ColumnOptions {
  /** The active destination's id (X-Location-Id) — decides source vs requester for the status label. */
  activeDestinationId: string | null;
}

export const getColumns = ({
  activeDestinationId,
}: ColumnOptions): ColumnDef<TransferRequest>[] => [
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
    accessorKey: "requestNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Request
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
        {row.original.requestNumber}
      </span>
    ),
  },
  {
    id: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="text-gray-900">
        {row.original.sourceLocationName || "Source"}
      </span>
    ),
  },
  {
    id: "requestedBy",
    header: "Requested by",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {row.original.requestedByName || "—"}
      </span>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-gray-600">{row.original.items?.length ?? 0}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colors =
        TRANSFER_REQUEST_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
        >
          {getTransferRequestStatusLabel(row.original, activeDestinationId)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
