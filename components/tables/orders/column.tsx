"use client";
import {ColumnDef} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {CellAction} from "@/components/tables/orders/cell-action";
import { Orders } from "@/types/orders/type";


export const columns: ColumnDef<Orders>[] = [
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
        accessorKey: "orderNumber",
        enableHiding: false,
        header: ({ column }) => {
            return (
                <Button
                    className="text-left p-0"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Order Number
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        
        accessorKey: "openedDate",
        header: "Open Date",
        enableHiding: true,
        cell: ({ row }) => {
            const orderDate = row.original.openedDate;
            const formatted = new Intl.DateTimeFormat("en",{dateStyle: "medium",timeStyle: "short"}).format(new Date(orderDate));
            return <div className="w-[100px]">{formatted}</div>;
        }
       
    },
    {
        
        accessorKey: "closedDate",
        header: "Closed Date",
        enableHiding: true,
        cell: ({ row }) => {
            const closedDate = row.original.closedDate;
            const formatted = new Intl.DateTimeFormat("en",{dateStyle: "medium",timeStyle: "short",timeZone: "UTC"}).format(new Date(closedDate));
            return <div className="w-[100px]">{
                closedDate ? formatted : "-"
            }</div>;
        }
       
    },
    {
        accessorKey:'orderType',
        header: "OrderType",
        cell: ({ row }) => {
            const orderType = row.original.orderType;
            return (
                <div className="flex items-center px-2 py-1 rounded">
                    {orderType === "DIRECT_SALE" && (
                        <span className="text-white bg-green-500 p-1 rounded-sm">Direct</span>
                    )}
                    {orderType === "CREDIT_SALE" && (
                        <span className="text-white bg-yellow-500 p-1 rounded-sm">Credit</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "orderPaymentStatus",
        header: "Payment",
        cell: ({ row }) => {
            const paymentStatus = row.original.orderPaymentStatus;
            return (
                <div className="flex items-center px-2 py-1 rounded">
                    {paymentStatus === "PAID" && (
                        <span className="text-white bg-green-500 p-1 rounded-sm">Paid</span>
                    )}
                    {paymentStatus === "PARTIAL_PAID" && (
                        <span className="text-sm text-white bg-yellow-500 p-1 rounded-sm">Partial Paid</span>
                    )}
                    {paymentStatus === "NOT_PAID" && (
                        <span className="text-sm text-white bg-gray-500 p-1 rounded-sm">Not Paid</span>
                    )}
                </div>
            )
        },
        enableHiding: false,
    },
    {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => {
            const items = row.original.items.length;
            return (
                <div className="flex items-center px-2 py-1 rounded">
                    {items}
                </div>
            )
        }

    },
    {
        accessorKey: "orderStatus",
        header: "Status",
        cell: ({ row }) => {
            const orderStatus = row.original.orderStatus;
            return (
                <div className="flex items-center px-2 py-1 rounded">
                    {orderStatus === "OPEN" && (
                        <span className="text-white bg-blue-500 p-1 rounded-sm">Open</span>
                    )}
                    {orderStatus === "CLOSED" && (
                        <span className="text-white bg-green-500 p-1 rounded-sm">Closed</span>
                    )}
                </div>
            )
        },
        enableHiding: false,
    },
    
    
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
