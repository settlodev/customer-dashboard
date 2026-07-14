"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { CellAction } from "@/components/tables/warehouse/requests/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockRequests } from "@/types/warehouse/purchase/request/type";

const formatDate = (value: unknown): string => {
  if (!value) return "-";
  const formatted = new Date(value as string).toLocaleString();
  return formatted === "Invalid Date" ? "-" : formatted;
};

const sortableHeader = (label: string) => {
  const SortableHeader = ({ column }: any) => (
    <Button
      className="text-left p-0"
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
  SortableHeader.displayName = `SortableHeader(${label})`;
  return SortableHeader;
};

const statusVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
};

export const columns: ColumnDef<StockRequests>[] = [
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
    accessorKey: "toWarehouseName",
    header: sortableHeader("Warehouse"),
    enableHiding: false,
  },
  {
    accessorKey: "fromLocationName",
    header: sortableHeader("Location"),
    enableHiding: false,
  },
  {
    accessorKey: "warehouseStockName",
    header: "Stock",
    enableHiding: false,
    // Combine stock + variant into one cell to save space
    cell: ({ row }) => {
      const stock = row.original.warehouseStockName;
      const variant = row.original.warehouseStockVariantName;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{stock}</span>
          {variant && (
            <span className="text-xs text-muted-foreground">{variant}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    enableHiding: false,
  },
  {
    accessorKey: "requestStatus",
    header: "Status",
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.getValue("requestStatus") as string;
      return <Badge variant={statusVariant(status) as any}>{status}</Badge>;
    },
  },
  {
    accessorKey: "locationStaffRequestedName",
    header: "Requested By",
    enableHiding: false,
  },
  {
    accessorKey: "requestedDate",
    header: sortableHeader("Requested"),
    enableHiding: false,
    cell: ({ row }) => formatDate(row.getValue("requestedDate")),
  },
  // Collapse approved/cancelled into one "Actioned" column
  {
    id: "actionedInfo",
    header: "Actioned By / Date",
    cell: ({ row }) => {
      const {
        requestStatus,
        warehouseStaffApprovedName,
        approvedDate,
        cancelledDate,
      } = row.original;
      const isApproved = requestStatus?.toUpperCase() === "APPROVED";
      const isCancelled = requestStatus?.toUpperCase() === "CANCELLED";

      if (!isApproved && !isCancelled)
        return <span className="text-muted-foreground">-</span>;

      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {warehouseStaffApprovedName || "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(isApproved ? approvedDate : cancelledDate)}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
