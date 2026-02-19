"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/stock-purchases/cell-action";
import { StockPurchase } from "@/types/stock-purchases/type";

export const columns: ColumnDef<StockPurchase>[] = [
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
    header: "PO Number",
    enableHiding: true,
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    enableHiding: true,
    cell: ({ row }) => {
      const supplierName = row.original.supplierName;
      const supplierPhone = row.original.supplierPhoneNumber;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{supplierName}</span>
          <span className="text-xs text-muted-foreground">{supplierPhone}</span>
        </div>
      );
    },
  },
  {
    id: "stockItems",
    header: "Stock Items",
    enableHiding: false,
    cell: ({ row }) => {
      const items = row.original.stockIntakePurchaseOrderItems || [];
      return (
        <div className="flex flex-col gap-1 max-w-md">
          {items.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {item.quantity}x
              </span>
              <span className="text-sm truncate">{item.stockVariantName}</span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{items.length - 3} more items
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "totalQuantity",
    header: ({ column }) => {
      return (
        <Button
          className="text-left p-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const items = row.original.stockIntakePurchaseOrderItems || [];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const formatted = new Intl.NumberFormat("en-US").format(totalQuantity);
      return <div className="w-[100px] font-medium">{formatted}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "deliveryDate",
    header: "Delivery Date",
    enableHiding: true,
    cell: ({ row }) => {
      const deliveryDate = row.original.deliveryDate;
      if (!deliveryDate) return <div className="w-[100px]">-</div>;

      const formatted = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(deliveryDate));
      return <div className="w-[100px]">{formatted}</div>;
    },
  },
  {
    accessorKey: "dateCreated",
    header: "Date Created",
    enableHiding: true,
    cell: ({ row }) => {
      const dateCreated = row.original.dateCreated;
      if (!dateCreated) return <div className="w-[100px]">-</div>;

      const formatted = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateCreated));
      return <div className="w-[100px] text-muted-foreground">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const status = row.original.status;
      const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
          case "submitted":
            return "default";
          case "pending":
            return "secondary";
          case "approved":
            return "success";
          case "rejected":
            return "destructive";
          case "delivered":
            return "outline";
          default:
            return "secondary";
        }
      };

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status?.toLowerCase() === "submitted"
              ? "bg-blue-100 text-blue-800"
              : status?.toLowerCase() === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    accessorKey: "actions",
    enableHiding: false,
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
