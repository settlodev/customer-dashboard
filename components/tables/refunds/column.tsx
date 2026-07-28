"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/refunds/cell-action";
import { OrderItemRefunds } from "@/types/refunds/type";

export const columns: ColumnDef<OrderItemRefunds>[] = [
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
    accessorKey: "orderNumber",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "orderItemName",
    header: "Item",
    enableHiding: false,
  },
  {
    accessorKey: "staffName",
    header: "Closed Date",
    enableHiding: false,
  },
  {
    accessorKey: "approvedByName",
    header: "Approved By",
    enableHiding: false,
  },
  {
    accessorKey: "stockReturned",
    header: "Stock Returned",
    enableHiding: false,
    cell: ({ row }) => {
      const stock = row.original.stockReturned;
      return (
        <div className="flex items-center px-2 py-1 rounded">
          {stock && (
            <span className="text-white bg-green-500 p-1 rounded-sm">Yes</span>
          )}
          {!stock && (
            <span className="text-sm text-white bg-yellow-500 p-1 rounded-sm">
              No
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "dateOfRefund",
    header: "Date of Refund",
    enableHiding: false,
    cell: ({ row }) => {
      const date = row.original.dateOfReturn;
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(date));
      return <div>{formattedDate}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
