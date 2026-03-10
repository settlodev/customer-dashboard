"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle2, Clock, ThumbsUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/proforma-invoice/cell-action";
import { Proforma } from "@/types/proforma/type";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (value?: Date | string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function ProformaStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    DRAFT: {
      label: "Draft",
      icon: <Clock className="w-3 h-3" />,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COMPLETE: {
      label: "Complete",
      icon: <CheckCircle2 className="w-3 h-3" />,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    ACCEPTED: {
      label: "Accepted",
      icon: <ThumbsUp className="w-3 h-3" />,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
  };

  const cfg = map[status] ?? {
    label: status,
    icon: null,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columns: ColumnDef<Proforma>[] = [
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
    accessorKey: "proformaNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Invoice #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-blue-600 whitespace-nowrap">
        {row.original.proformaNumber}
      </span>
    ),
  },
  {
    id: "customer",
    header: ({ column }) => (
      <Button
        className="text-left p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <p className="font-medium text-sm whitespace-nowrap">
        {row.original.customerFirstName} {row.original.customerLastName}
      </p>
    ),
  },
  {
    accessorKey: "dateCreated",
    header: "Creation Date",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.dateCreated)}
      </span>
    ),
  },
  {
    accessorKey: "expiresAt",
    header: "Due Date",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.expiresAt)}
      </span>
    ),
  },
  {
    accessorKey: "grossAmount",
    header: ({ column }) => (
      <Button
        className="text-left p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Gross Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-sm whitespace-nowrap">
        {formatCurrency(row.original.grossAmount ?? 0)}
      </span>
    ),
  },
  {
    accessorKey: "appliedDiscountAmount",
    header: "Discount",
    cell: ({ row }) => (
      <span className="text-sm text-red-500 whitespace-nowrap">
        {row.original.appliedDiscountAmount > 0
          ? `− ${formatCurrency(row.original.appliedDiscountAmount)}`
          : "—"}
      </span>
    ),
  },
  {
    id: "netAmount",
    header: "Net Amount",
    cell: ({ row }) => {
      const net =
        (row.original.grossAmount ?? 0) -
        (row.original.appliedDiscountAmount ?? 0);
      return (
        <span className="font-semibold text-sm whitespace-nowrap">
          {formatCurrency(Math.max(0, net))}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "proformaStatus",
    header: "Status",
    enableHiding: false,
    cell: ({ row }) => (
      <ProformaStatusBadge status={row.original.proformaStatus} />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
