"use client";

import { ColumnDef } from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StateColumn } from "@/components/tables/state-column";
import {Business} from "@/types/business/type";
import {CellAction} from "@/app/(protected)/business/cell-action";

export const columns: ColumnDef<Business>[] = [
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
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        id: "prefix",
        accessorKey: "prefix",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button className="text-left p-0" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Prefix
                </Button>
            );
        },
    },
    {
        id: "countryName",
        accessorKey: "countryName",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Country
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        id: "totalLocations",
        accessorKey: "totalLocations",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Total Locations
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <><span className="text-emerald-500 font-bold px-2">{row.original.totalLocations}</span> <span>Location{row.original.totalLocations>1 && 's'}</span></>,
    },
    {
        accessorKey: "businessType",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({row})=><span className="rounded-full bg-gray-100 text-gray-700 text-xs font-medium pl-2 pr-2 pt-1 pb-1">{row.original.businessType}</span>
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
        id: "vfdRegistrationState",
        accessorKey: "vfdRegistrationState",
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    VFD
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <StateColumn state={row.original.vfdRegistrationState} />,
        enableHiding: false,
    },
    {
        id: "actions",
        accessorKey: "",
        cell: ({ row }) => <CellAction data={row.original} />
    },
];
