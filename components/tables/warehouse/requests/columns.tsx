"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/warehouse/requests/cell-action";
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
    accessorKey: "toWarehouseName",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Warehouse
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      );
    },
  },

  {
    accessorKey: "warehouseStockVariantName",
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
    header: "Requested By",
  },
  
  {
    accessorKey: "warehouseStockRequestStatus",
    enableHiding: false,
    header: "Request Status",
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
    accessorKey: "warehouseStaffApprovedName",
    enableHiding: false,
    header: "Approved By",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
