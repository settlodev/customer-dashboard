
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
    header: "SIP Number",
  },
  {
    accessorKey:"stockVariantName",
    enableHiding:false,
    header:'Item'
  },
  {
    accessorKey:"stockIntakeQuantity",
    enableHiding:false,
    header:'Quantity'
  },
  {
    accessorKey:"supplierName",
    enableHiding:false,
    header:'Supplier'
  },
  {
    accessorKey: "totalPurchaseCost",
    enableHiding:false,
    header:'Total Purchase Cost'
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
    cell: (row) => {
      const status = row.getValue();
      
      switch (status) {
        case "NOT_PAID":
          return "NOT PAID";
        case "PARTIAL":
          return "PARTIAL PAID";
        default:
          return status;
      }
    }
  },
  {
    accessorKey:"dateCreated",
    enableHiding:false,
    header:'Date Created',
    cell:(row)=>{
      const date = new Date(row.getValue() as string)
      return date.toLocaleDateString()
    }
  },
  
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];