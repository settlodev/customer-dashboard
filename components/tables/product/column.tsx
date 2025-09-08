"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown, ShoppingCartIcon} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
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
        header: "Image",
        enableHiding: false,
        cell: ({ row }) => {
            const image = row.original.image;

            // Check if image is a valid URL or path
            const isValidImageUrl = image &&
                (image.startsWith('http://') ||
                    image.startsWith('https://') ||
                    image.startsWith('/'));

            return isValidImageUrl ? (
                <Image
                    src={image}
                    alt={row.original.name}
                    className="w-10 h-10 rounded-lg"
                    width={50}
                    height={50}
                    loading="lazy"
                />
            ) : (
                // Fallback for invalid and missing images
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <ShoppingCartIcon />
                </div>
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
        accessorKey: "quantity",
        enableHiding: true,
        header: 'Stock Quantity',
        cell: ({ row }) => {
            const quantity = row.original.quantity;
            return <span>{quantity}</span>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
