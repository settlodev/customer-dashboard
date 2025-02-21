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
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="text-left p-0"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Order #
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium">{row.original.orderNumber}</div>
        ),
    },
    {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.original.customerName}</span>
                <span className="text-sm text-gray-500">{row.original.platformType}</span>
            </div>
        ),
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="text-left p-0"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const amount = parseFloat(String(row.original.amount));
            const formatted = new Intl.NumberFormat('en-Tz', {
                style: 'currency',
                currency: 'Tzs'
            }).format(amount);

            return (
                <div className="font-medium">
                    {formatted}
                </div>
            );
        },
    },
    {
        accessorKey: "orderType",
        header: "Order Type",
        cell: ({ row }) => {
            const orderType = row.original.orderType;
            return (
                <div className="flex items-center">
                    {orderType === "IMMEDIATE" && (
                        <span className="text-white bg-[#FF8755] px-2 py-1 rounded-full text-xs">
                            Immediate
                        </span>
                    )}
                    {orderType === "RESERVATION" && (
                        <span className="text-white bg-yellow-500 px-2 py-1 rounded-full text-xs">
                            Reservation
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "orderPaymentStatus",
        header: "Payment status",
        cell: ({ row }) => {
            const status = row.original.orderPaymentStatus;
            const statusStyles = {
                PAID: "bg-green-500",
                PARTIAL_PAID: "bg-yellow-500",
                NOT_PAID: "bg-gray-500"
            };
            const statusText = {
                PAID: "Paid",
                PARTIAL_PAID: "Partial",
                NOT_PAID: "Unpaid"
            };

            return (
                <div className="flex items-center">
                    <span className={`${statusStyles[status as keyof typeof statusStyles]} text-white px-2 py-1 rounded-full text-xs`}>
                        {statusText[status as keyof typeof statusText]}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: "orderStatus",
        header: "Order status",
        cell: ({ row }) => {
            const status = row.original.orderStatus;
            return (
                <div className="flex items-center">
                    {status === "OPEN" && (
                        <span className="text-white bg-blue-500 px-2 py-1 rounded-full text-xs">
                            Open
                        </span>
                    )}
                    {status === "CLOSED" && (
                        <span className="text-white bg-green-500 px-2 py-1 rounded-full text-xs">
                            Closed
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
