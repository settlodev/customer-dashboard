"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/product/cell-action";
import {Product} from "@/types/product/type";


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
        header: 'Category'
    },
    {
        accessorKey: "brandName",
        header: "Brand",
        enableHiding: true,
    },
    {
        accessorKey: "variants",
        enableHiding: false,
        header: 'Cost',
        cell: ({ row }) => {
            const variants = row.original.variants; 
            const cost = variants.length > 0 ? variants[0].cost : "N/A"; 
            return <span>{cost}</span>; 
        },
    },
    {
        accessorKey: "variants", // Change this to access the variants array
        enableHiding: false,
        header: ' Price',
        cell: ({ row }) => {
            const variants = row.original.variants; 
            const price = variants.length > 0 ? variants[0].price : "N/A"; 
            return <span>{price}</span>; 
        },
    },

    {
        accessorKey: "variant",
        header: "Quantity",
        enableHiding: true,
        cell: ({ row }) => {
            const variants = row.original.variants; 
            const quantity = variants.length > 0 ? variants[0].quantity : "N/A"; 
            return <span>{quantity}</span>;
        }
    },
    {
        id: "outOfStock",
        header: "Stock Status",
        cell: ({ row }) => {
            const variants = row.original.variants; 
            const quantity = variants.length > 0 ? variants[0].quantity : 0; 
            return quantity === 0 ? <span className="px-2 py-1 rounded-full bg-red-500 text-sm text-white">OutOfStock</span> : <span className="px-2 py-1 rounded-full bg-green-500 text-sm text-white">InStock</span>; // Show "Out of Stock" if quantity is 0
        },
        enableHiding: true,
    },
    {
        accessorKey: "variant",
        header: "SKU",
        enableHiding: true,
        cell: ({ row }) => {
            const variants = row.original.variants; 
            const sku = variants.length > 0 ? variants[0].sku : "N/A"; 
            return <span>{sku}</span>;
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
