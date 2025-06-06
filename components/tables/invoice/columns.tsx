"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/expense/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StateColumn } from "../state-column";
import { Invoice } from "@/types/invoice/type";

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
      const amount = parseFloat(row.getValue("totalAmount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
  {
    id: "unpaidAmount",
    accessorKey: "UnPaid Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("unpaidAmount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },

  {
    id: "paidAmount",
    accessorKey: "Paid Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("paidAmount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
   
  {
    
    accessorKey: "locationInvoiceStatus",
    header: "Status",
    cell: ({ row }) => {
      return <StateColumn state={row.getValue("locationInvoiceStatus")} />;
    },
},
 
  // {
  //   id: "actions",
  //   cell: ({ row }) => <CellAction data={row.original} />,
  // },
];
