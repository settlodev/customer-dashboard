"use client";

import { ColumnDef } from "@tanstack/react-table";
import {ArrowUpDown, PencilIcon} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StateColumn } from "@/components/tables/state-column";
import {Business} from "@/types/business/type";
import {CellAction} from "@/app/(protected)/business/cell-action";
import {DeleteIcon, EditIcon, EyeIcon} from "@nextui-org/shared-icons";

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
        /*cell: ({ row }) => {
            console.log("Row is: ", row);
            return <div style={{alignItems: 'flex-end'}}>
                <div style={{
                    display: 'flex',
                    float: 'right',
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    fontSize: 20,
                    alignSelf: "flex-end"
                }}>

                    <div style={{flex: 1}}>
                        <EyeIcon color={'#384B70'}/>
                    </div>
                    <div style={{flex: 1}}>
                        <EditIcon color={'#384B70'}/>
                    </div>
                    <div style={{flex: 1}}>
                        <DeleteIcon color={'#D91656'}/>
                    </div>
                </div>
            </div>
        }*/
    },
];
