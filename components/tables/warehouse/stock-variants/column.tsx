"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {CellAction} from "@/components/tables/stock-variants/cell-action";
import { StockVariant } from "@/types/stockVariant/type";


export const columns: ColumnDef<StockVariant>[] = [

    
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
        accessorKey: "stockAndStockVariantName",
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
    // {
    //     accessorKey: "name",
    //     enableHiding: false,
    //     header: "Item"
    // },
 
    {
        accessorKey: "currentAvailable",
        header: "Current Quantity",
        enableHiding: true,
        cell: ({ row }) => {
            const current = row.original.currentAvailable; 
            const formattedCurrent = Intl.NumberFormat("en-US").format(current); 
            return <span>{formattedCurrent}</span>; 
        }
    },
    {
        accessorKey: "currentTotalValue",
        header: "Current Total Value",
        enableHiding: true,
        cell: ({ row }) => {
            const averageValue = row.original.currentTotalValue; 
            const formattedAverageValue = Intl.NumberFormat("en-US").format(averageValue); 
            return <span>{formattedAverageValue}/=</span>;
        }
    },
    {
        accessorKey: "lastStockIntakeTime",
        header: ({ }) => (
          <div className="hidden md:block">Last intake at</div>
        ),
        enableHiding: true,
        cell: ({ row }) => {
            const time = row.original.lastStockIntakeTime
            const formattedValue = Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).format(new Date(time))
            return <span className="hidden md:block lg:block">{formattedValue}</span>;
        }
    },
    {
        accessorKey: "isArchived",
        enableHiding: false,
        header: "Archived",
        cell: ({ row }) => {
            return <span>{row.original.isArchived ? "YES" : "NO"}</span>;
        }
    },
    {
        id: "actions",
        // header: "Actions",
        enableHiding: false,
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
