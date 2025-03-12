"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
// import {StateColumn} from "@/components/tables/state-column";
import {CellAction} from "@/components/tables/stock-intake/cell-action";
import { StockIntake } from "@/types/stock-intake/type";



export const columns: ColumnDef<StockIntake>[] = [
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
            const formatted = new Intl.NumberFormat("en-US").format(quantity);
            return <div className="">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "value",
        header: "Value / Amount",
        enableHiding: true,
        cell: ({ row }) => {
            const value = row.original.value;
            const formatted = new Intl.NumberFormat("en-US").format(value);
            return <div className="">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "orderDate",
        header: ({}) => (
            <div className="hidden md:block lg:block">Order Date</div>
          ),
        enableHiding: true,
        cell: ({ row }) => {
            const orderDate = row.original.orderDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(orderDate));
            return <div className="hidden md:block lg:block">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "deliveryDate",
        header: ({}) => (
            <div className="hidden md:block lg:block">Delivery Date</div>
          ),
        enableHiding: true,
        cell: ({ row }) => {
            const deliveryDate = row.original.deliveryDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(deliveryDate));
            return <div className="hidden md:block lg:block">{formatted}</div>;
        }
       
    },

    {
        
        accessorKey: "batchExpiryDate",
        header: ({}) => (
            <div className="hidden md:block lg:block">Expiry Date</div>
          ),
        enableHiding: true,
        cell: ({ row }) => {
            const batchExpiryDate = row.original.batchExpiryDate;
            const formatted = new Intl.DateTimeFormat("en-US").format(new Date(batchExpiryDate));
            return <div className="hidden md:block lg:block">{batchExpiryDate !== null ? formatted : "-"}</div>;
        }
       
    },
   
    // {
    //     id: "status",
    //     accessorKey: "status",
    //     header: ({ column }) => {
    //         return (
    //             <Button
    //                 className="text-left p-0"
    //                 variant="ghost"
    //                 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //             >
    //                 Status
    //                 <ArrowUpDown className="ml-2 h-4 w-4" />
    //             </Button>
    //         );
    //     },
    //     cell: ({ row }) => <StateColumn state={row.original.status} />,
    //     enableHiding: false,
    // },
    {
        id: "actions",
        accessorKey: "actions",
        enableHiding: false,
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];