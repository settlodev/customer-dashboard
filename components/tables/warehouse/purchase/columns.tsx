
"use client";

import { ColumnDef } from "@tanstack/react-table";

import { CellAction } from "@/components/tables/warehouse/purchase/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
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
    accessorKey: "stockIntakePurchaseNumber",
    enableHiding: false,
    header: "Stock Intake Purchase Number",
  },
  {
    accessorKey:"stockVariantName",
    enableHiding:false,
    header:'Item'
  },
  {
    accessorKey: "totalPurchaseCost",
    enableHiding:false,
    header:'Total Cost'
  },
  
  {
    accessorKey: "paidAmount",
    enableHiding: false,
    header: 'Paid Amount'
  },
  {
    accessorKey: "unpaidAmount",
    enableHiding: false,
    header: 'Unpaid Amount'
  },
  
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
  },
  
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];