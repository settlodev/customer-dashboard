"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StockTransfer, TRANSFER_STATUS_LABELS } from "@/types/stock-transfer/type";

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-cyan-50 text-cyan-700",
  DISPATCHED: "bg-indigo-50 text-indigo-700",
  PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700",
  RECEIVED: "bg-emerald-50 text-emerald-700",
  ACCEPTED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-red-700",
  RETURN_IN_TRANSIT: "bg-orange-50 text-orange-700",
  RETURNED: "bg-gray-50 text-gray-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export const columns: ColumnDef<StockTransfer>[] = [
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
      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
        {row.original.transferNumber}
      </span>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => (
      <div className="text-sm">
        <span className="text-gray-900">{row.original.sourceLocationName || "Source"}</span>
        <span className="text-gray-400 mx-1">&rarr;</span>
        <span className="text-gray-900">{row.original.destinationLocationName || "Destination"}</span>
      </div>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.items?.length ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
          {TRANSFER_STATUS_LABELS[status] || status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];
