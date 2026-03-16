"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { CellAction } from "@/components/tables/reservation/cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reservation, RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS, DEPOSIT_STATUS_LABELS } from "@/types/reservation/type";
import { ReservationStatus, DepositPaymentStatus } from "@/types/enums";

export const columns: ColumnDef<Reservation>[] = [
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
    accessorKey: "reservationDate",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date & Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.reservationDate;
      const time = row.original.reservationTime;
      const formatted = date
        ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(date),
          )
        : "";
      const timeStr = time ? time.substring(0, 5) : "";
      return (
        <div>
          <div className="font-medium">{formatted}</div>
          {timeStr && (
            <div className="text-sm text-muted-foreground">{timeStr}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.original.customerName;
      return <div>{name || "Walk-in"}</div>;
    },
  },
  {
    accessorKey: "peopleCount",
    header: "Guests",
    cell: ({ row }) => (
      <div className="text-center">{row.original.peopleCount}</div>
    ),
  },
  {
    accessorKey: "tableAndSpaceName",
    header: "Table",
    cell: ({ row }) => {
      const name = row.original.tableAndSpaceName;
      return <div>{name || "Unassigned"}</div>;
    },
  },
  {
    accessorKey: "reservationStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.reservationStatus as ReservationStatus;
      const label =
        RESERVATION_STATUS_LABELS[status] || status;
      const colorClass =
        RESERVATION_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
      return (
        <Badge variant="outline" className={colorClass}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "depositPaymentStatus",
    header: "Deposit",
    cell: ({ row }) => {
      const status = row.original.depositPaymentStatus as DepositPaymentStatus | null;
      if (!status) return <div className="text-muted-foreground">—</div>;
      const label = DEPOSIT_STATUS_LABELS[status] || status;
      return <div className="text-sm">{label}</div>;
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.original.source;
      return <div className="text-sm">{source || "—"}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
