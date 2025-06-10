"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/invoice/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/types/invoice/type";

import { invoiceStatus } from "@/types/enums";

export const columns: ColumnDef<Invoice>[] = [
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
    accessorKey: "invoiceNumber",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    id: "totalAmount",
    accessorKey: "Total Amount",
    cell: ({ row }) => {
      const amount = row.original.totalAmount; 
      const formattedAmount = Intl.NumberFormat("en-US").format(amount); 
      return <span>{formattedAmount}/=</span>;
  }

  },
  {
    id: "unpaidAmount",
    accessorKey: "UnPaid Amount",
    cell: ({ row }) => {
      const amount = row.original.unpaidAmount; 
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },

  {
    id: "paidAmount",
    accessorKey: "Paid Amount",
    cell: ({ row }) => {
      const amount = row.original.paidAmount; 
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
   
  {
    accessorKey: "locationInvoiceStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.locationInvoiceStatus;
      if(status === invoiceStatus.PAID){
        return <div className="bg-green-600 text-white p-1 text-center rounded-sm">Paid</div>
      }
      else if(status === invoiceStatus.PARTIALLY_PAID){
        return <div className="bg-yellow-600 text-white p-1 text-center rounded-sm">Partially Paid</div>
      }
      else{
        return <div className="bg-red-600 text-white p-1 text-center rounded-sm">Unpaid</div>
      }
    }
},
 
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
