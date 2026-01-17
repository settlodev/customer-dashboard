"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/expense/cell-action";
import { Expense } from "@/types/expense/type";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StateColumn } from "../state-column";

export const columns: ColumnDef<Expense>[] = [
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
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "expenseCategoryName",
    header: "Category",
  },
  {
    id: "amount",
    accessorKey: "amount",
    header:'Total amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "paidAmount",
    header:'Paid Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("paidAmount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "unpaidAmount",
    header:'UnPaid Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("unpaidAmount"));
      const formattedAmount = Intl.NumberFormat().format(amount);
      return <div>{formattedAmount}</div>;
    },
    enableHiding: false,
  },
   {
    id:'date',
    accessorKey:"date",
    header:"Date",
    enableHiding: false,
    cell: ({row})=>{
      const date = row.original.date;
      const format = new Intl.DateTimeFormat("en").format(new Date(date))
      return <div>{format}</div>
    }
   }, 
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
