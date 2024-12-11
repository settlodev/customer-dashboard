"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
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
        accessorKey: "variants",
        header: "Image",
        enableHiding: false,
        cell: ({ row }) => {
            const image = row.original.variants[0].image;
            return ( image ? <Image src={image} alt={row.original.name} className="w-10 h-10 rounded-lg" width={50} height={50} loading="lazy" /> : 
                <div className="w-10 h-10 rounded-lg bg-emerald-500"></div>
            );
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
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
 
    {
        accessorKey: "categoryName",
        enableHiding: true,
        header: 'Category',
        cell: ({ row }) => {
            const category = row.original.categoryName;
            return <span>{category ? category : "None"}</span>;
        }
    },
    {
        accessorKey: "brandName",
        header: "Brand",
        enableHiding: true,
        cell: ({ row }) => {
            const brand = row.original.brandName;
            return <span>{brand ? brand : "None"}</span>;
        }
    },
    {
        accessorKey: "variants", // Change this to access the variants array
        enableHiding: false,
        header: 'No. of Variants',
        cell: ({ row }) => {
            const variants = row.original.variants; 
            return <span>{variants.length}</span>;
        },
    },

    {
        accessorKey: "sku",
        header: "SKU",
        enableHiding: true,
        cell: ({ row }) => {
            const sku = row.original.sku; 
            return <span>{sku ? sku : "None"}</span>;
        }
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
