"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown, ImageIcon} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/product/cell-action";
import {Product} from "@/types/product/type";
import Image from "next/image";

export const columns: ColumnDef<Product>[] = [
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
        accessorKey: "image",
        enableHiding: false,
        header: () => {
            return (
                <span>Image</span>
            );
        },
        cell: ({row})=>{
            return <div className="w-[60px] h-[60px] rounded-md overflow-hidden flex items-center justify-center">
                {row.original.image?
                    <Image src={row.original.image} className="rounded-md" width={60} height={60}  alt="Image" />:
                    <ImageIcon size={32} />
                }
            </div>
        }
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
                    Product Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    /*{
        accessorKey: "categoryName",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },*/
    {
        accessorKey: "departmentName",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Department
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "sku",
        header: "Sku",
    },
    {
        accessorKey: "brandName",
        header: "brandName",
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
