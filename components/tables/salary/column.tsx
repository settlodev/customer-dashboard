"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/salary/cell-action";
import { Salary } from "@/types/salary/type";


export const columns: ColumnDef<Salary>[] = [
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
    // {
    //     accessorKey: "staff",
    //     enableHiding: false,
    //     header: ({ column }) => {
    //         return (
    //             <Button
    //                 className="text-left p-0"
    //                 variant="ghost"
    //                 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //             >
    //                 Staff
    //                 <ArrowUpDown className="ml-2 h-4 w-4" />
    //             </Button>
    //         );
    //     },
    // },
    {
        accessorKey: "amount",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "bankName",
        header: "Bank name",
    },
    {
        accessorKey: "accountNumber",
        header: "Account number",
    },
    {
        accessorKey: "branch",
        header: "Branch",
    },
   
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
