"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
// import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/stock-intake/cell-action";
import { StockIntake } from "@/types/stock-intake/type";



export const columns: ColumnDef<StockIntake>[] = [
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
        accessorKey: "stockVariantName",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "stockAndStockVariantName",
        enableHiding: false,
        header: 'Item',
    },
 
    {
        accessorKey: "quantity",
        header: "Quantity",
        enableHiding: true,
        cell: ({ row }) => {
            const quantity = row.original.quantity;
            const formatted = new Intl.NumberFormat("en-US").format(quantity);
            return <div className="">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "value",
        header: "Value / Amount",
        enableHiding: true,
        cell: ({ row }) => {
            const value = row.original.value;
            const formatted = new Intl.NumberFormat("en-US").format(value);
            return <div>{formatted}</div>;
        }
       
    },
    {
        id: "costPerItem",
        header: "Cost Per Item",
        enableHiding: true,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
            const costA = rowA.original.value / rowA.original.quantity;
            const costB = rowB.original.value / rowB.original.quantity;
            return costA - costB;
        },
        cell: ({ row }) => {
            const quantity = row.original.quantity;
            const value = row.original.value;
            
            const costPerItem = quantity > 0 ? value / quantity : 0;
            
            const formatted = new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(costPerItem);
            
            return (
                <div className="text-black p-2 rounded-sm bg-emerald-400">
                    {formatted}
                    <span className="text-black text-sm ml-1">TSH</span>
                </div>
            );
        }
    },
    {
        
        accessorKey: "orderDate",
        header: ({ }) => (
            <div className="hidden md:block lg:block">Order Date</div>
        ),
        enableHiding: true,
        cell: ({ row }) => {
            const orderDate = row.original.orderDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(orderDate));
            return <div className="hidden md:block lg:block">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "deliveryDate",
        header: ({ }) => (
            <div className="hidden md:block lg:block">Delivery Date</div>
        ),
        enableHiding: true,
        cell: ({ row }) => {
            const deliveryDate = row.original.deliveryDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(deliveryDate));
            return <div className="hidden md:block lg:block">{formatted}</div>;
        }
       
    },

    {
        accessorKey: "batchExpiryDate",
        header: ({ }) => (
            <div className="hidden md:block lg:block">Expiry Date</div>
        ),
        enableHiding: true,
        cell: ({ row }) => {
            const batchExpiryDate = row.original.batchExpiryDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(batchExpiryDate));
            return (
                <div className="hidden md:block lg:block">
                    {batchExpiryDate !== null ? formatted : "-"}
                </div>
            );
        }
    },
   
    {
        id: "actions",
        accessorKey: "actions",
        enableHiding: false,
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];