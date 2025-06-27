"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown} from "lucide-react";

import { CellAction } from "@/components/tables/warehouse/purchase/cell-action";
// import { StateColumn } from "@/components/tables/state-column";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Purchase } from "@/types/warehouse/purchase/type";

export const columns: ColumnDef<Purchase>[] = [
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
    accessorKey: "orderId",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Id
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "supplier",
    enableHiding:false,
    header:'Supplier'
  },
  
  {
    accessorKey: "date",
    enableHiding: false,
    header: 'Date'
  },
  {
    accessorKey: "product",
    enableHiding: false,
    header: 'Items'
  },
  {
    accessorKey: "amount",
    enableHiding: false,
    header: 'Amount'
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
