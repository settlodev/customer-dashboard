"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
// import {CellAction} from "@/components/tables/stock-modification/cell-action";
import { StockModification } from "@/types/stock-modification/type";



export const columns: ColumnDef<StockModification>[] = [
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
            const formatted = new Intl.NumberFormat().format(quantity);
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
        header: "Modification Date",
        enableHiding: true,
        cell: ({ row }) => {
            const modificationDate = row.original.dateCreated;
            const formatted = new Intl.DateTimeFormat().format(new Date(modificationDate));
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