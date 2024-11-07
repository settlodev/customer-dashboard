"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/stock/cell-action";
import { Stock } from "@/types/stock/type";


export const columns: ColumnDef<Stock>[] = [
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
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
 
    {
        accessorKey: "stockVariants",
        header: "Starting Value",
        enableHiding: true,
        cell: ({ row }) => {
            const variants = row.original.stockVariants; 
            const startingValue = variants.length > 0 ? variants[0].startingValue : "N/A"; 
            return <span>{startingValue}</span>;
        }
    },
    {
        accessorKey: "stockVariants",
        header: "Starting Quantity",
        enableHiding: true,
        cell: ({ row }) => {
            const variants = row.original.stockVariants; 
            const startingQuantity = variants.length > 0 ? variants[0].startingQuantity : "N/A"; 
            return <span>{startingQuantity}</span>;
        }
    },
    {
        
        accessorKey: "stockVariants",
        header: "Stock Alert Level",
        enableHiding: true,
        cell: ({ row }) => {
            const variants = row.original.stockVariants; 
            const alertLevel = variants.length > 0 ? variants[0].alertLevel : 0; 
            return <span>{alertLevel}</span>;},
    },
    // {
    //     accessorKey: "variant",
    //     header: "SKU",
    //     enableHiding: true,
    //     cell: ({ row }) => {
    //         const variants = row.original.variants; 
    //         const sku = variants.length > 0 ? variants[0].sku : "N/A"; 
    //         return <span>{sku}</span>;
    //     }
    // },
   
    {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <StateColumn state={row.original.status} />,
        enableHiding: false,
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
