"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  StockTransfer,
  TRANSFER_STATUS_COLORS,
  getTransferStatusLabel,
} from "@/types/stock-transfer/type";

interface ColumnOptions {
  /** The active destination's id (X-Location-Id) — decides source vs destination for the status label. */
  activeDestinationId: string | null;
}

export const getColumns = ({
  activeDestinationId,
}: ColumnOptions): ColumnDef<StockTransfer>[] => [
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
    accessorKey: "transferNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Transfer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-ink-2 bg-muted px-2 py-0.5 rounded">
        {row.original.transferNumber}
      </span>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => (
      <div >
        <span className="text-ink">{row.original.sourceLocationName || "Source"}</span>
        <span className="text-ink-3 mx-1">&rarr;</span>
        <span className="text-ink">{row.original.destinationLocationName || "Destination"}</span>
      </div>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-ink-2">
        {row.original.items?.length ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colors = TRANSFER_STATUS_COLORS[status] || "bg-muted text-ink-2";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
          {getTransferStatusLabel(row.original, activeDestinationId)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-ink-2">
        {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
