"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/stock-request/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StockRequests } from "@/types/warehouse/purchase/request/type";

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
    accessorKey: "fromLocationName",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          From Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "toWarehouseName",
    enableHiding: false,
    header: ({ column }) => {
      return (
          <Button
              className="text-left p-0"
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            To Warehouse
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
  },
  {
    accessorKey:"warehouseStockVariantName",
    header:"Stock Variant",
    enableHiding: false
  }
  ,
  {
    accessorKey: "quantity",
    enableHiding: false,
    header: "Quantity",
  },
  {
    accessorKey: "locationStaffRequestedName",
    enableHiding: false,
    header: "Staff Requested",
  },
  {
    accessorKey: "warehouseStockRequestStatus",
    enableHiding: false,
    header: "Status",
  },
  {
    accessorKey: "warehouseStaffApprovedName",
    enableHiding: false,
    header: "Staff Approved",
  },

  {
    accessorKey: "requestedDate",
    enableHiding: false,
    header: "Requested Date",
    cell:(row)=>{
      const date = new Date(row.getValue() as string)
      return date.toLocaleString()
    }
  },
  {
    accessorKey: "approvedDate",
    enableHiding: false,
    header: "Approved Date",
    cell: (row) => {
      const dateValue = row.getValue() as string;
      if (!dateValue) return "-";
      
      const formatted = new Date(dateValue).toLocaleString();
      return formatted === "Invalid Date" ? "-" : formatted;
    }
  },
  {
    accessorKey: "cancelledDate",
    enableHiding: false,
    header: "Cancelled Date",
    cell: (row) => {
      const dateValue = row.getValue() as string;
      if (!dateValue) return "-";
      
      const formatted = new Date(dateValue).toLocaleString();
      return formatted === "Invalid Date" ? "-" : formatted;
    }
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
