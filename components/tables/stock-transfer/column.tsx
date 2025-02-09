"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
// import {CellAction} from "@/components/tables/stock-transfer/cell-action";
import { StockTransfer } from "@/types/stock-transfer/type";



export const columns: ColumnDef<StockTransfer>[] = [
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
        
        accessorKey: "fromLocationName",
        header: "From",
        enableHiding: true,
        cell: ({ row }) => {
            const from = row.original.fromLocationName;
            return <div className="text-[16px]">{from}</div>;
        }
       
    },
    {
        
        accessorKey: "toLocationName",
        header: "To",
        enableHiding: true,
        cell: ({ row }) => {
            const to = row.original.toLocationName;
            return <div className="text-[16px] ">{to}</div>;
        }
       
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
                    Stock Item
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
            const formatted = new Intl.NumberFormat("en-US").format(quantity);
            return <div className="w-[100px]">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "value",
        header: "Value / Amount",
        enableHiding: true,
        cell: ({ row }) => {
            const value = row.original.value;
            const formatted = new Intl.NumberFormat("en-US").format(value);
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

   
   
    {
        
        accessorKey: "dateCreated",
        header: "Transfer Date",
        enableHiding: true,
        cell: ({ row }) => {
            const transferDate = row.original.dateCreated;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(transferDate));
            return <div className="w-[100px]">{formatted}</div>;
        }
       
    },
    // {
    //     id: "actions",
    //     accessorKey: "actions",
    //     enableHiding: false,
    //     cell: ({ row }) => <CellAction data={row.original} />,
    // },
];