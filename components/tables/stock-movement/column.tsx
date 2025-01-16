"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
// import {CellAction} from "@/components/tables/stock-transfer/cell-action";
import { StockMovement } from "@/types/stock-movement/type";



export const columns: ColumnDef<StockMovement>[] = [
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
        
        accessorKey: "stockName",
        header: "Stock",
        enableHiding: true,
        cell: ({ row }) => {
            const name = row.original.stockName;
            return <div className="text-[16px]">{name}</div>;
        }
       
    },
    {
        
        accessorKey: "stockVariantName",
        header: "Item",
        enableHiding: true,
        cell: ({ row }) => {
            const name = row.original.stockVariantName;
            return <div className="text-[16px] ">{name}</div>;
        }
       
    },
    
    {
        accessorKey: "stockMovementType",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Type of Movement
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
 
    {
        accessorKey: "quantity",
        header: "Quantity",
        enableHiding: true,
        cell: ({ row }) => {
            const quantity = row.original.quantity;
            const formatted = new Intl.NumberFormat().format(quantity);
            return <div className="w-[100px]">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "value",
        header: "Value / Amount",
        enableHiding: true,
        cell: ({ row }) => {
            const value = row.original.value;
            const formatted = new Intl.NumberFormat().format(value);
            return <div className="w-[100px]">{formatted}</div>;
        }
       
    },
   
    {
        
        accessorKey: "staffName",
        header: "Staff",
        enableHiding: true,
        cell: ({ row }) => {
            const staff = row.original.staffName;
            return <div className="w-[100px]">{staff}</div>;
        }
       
    },

    // {
    //     id: "actions",
    //     accessorKey: "actions",
    //     enableHiding: false,
    //     cell: ({ row }) => <CellAction data={row.original} />,
    // },
];