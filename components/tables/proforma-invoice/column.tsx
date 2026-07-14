"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ThumbsUp,
  XCircle,
  FileEdit,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CellAction } from "@/components/tables/proforma-invoice/cell-action";
import type { Proforma, ProformaStatus } from "@/types/proforma/type";
import { resolveDiscount, resolveTotals } from "@/lib/actions/total";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

/**
 * `expiresAt` is `string | null` on the wire, hence the null in the signature.
 *
 * Note there's no try/catch: `new Date("garbage")` returns an Invalid Date
 * rather than throwing, so the old catch block never actually fired. Checking
 * `getTime()` for NaN is what catches a bad value.
 */
const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fullName = (p: Proforma) =>
  [p.customerFirstName, p.customerLastName].filter(Boolean).join(" ");

// ─── Status Badge ─────────────────────────────────────────────────────────────

/**
 * Typed as `Record<ProformaStatus, …>` deliberately: adding a status to the
 * union without adding a badge here is now a build failure, rather than a grey
 * pill showing the raw enum string in production.
 *
 * The old map keyed on "COMPLETE" and "ACCEPTED" — neither of which the API
 * sends — and had no entry for "AWAITING", which it does send.
 */
const STATUS_CONFIG: Record<
  ProformaStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  DRAFT: {
    label: "Draft",
    icon: <FileEdit className="w-3 h-3" />,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
  AWAITING: {
    label: "Awaiting",
    icon: <Clock className="w-3 h-3" />,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: <ThumbsUp className="w-3 h-3" />,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  EXPIRED: {
    label: "Expired",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
};

function ProformaStatusBadge({ status }: { status: ProformaStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    // Defensive only — if this branch renders, the API sent a status that isn't
    // in the union and the type needs updating.
    label: String(status),
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

// ─── Sortable header ──────────────────────────────────────────────────────────

function SortableHeader({
  column,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any;
  label: string;
}) {
  return (
    <Button
      className="text-left p-0"
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
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
      <SortableHeader column={column} label="Invoice #" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-blue-600 whitespace-nowrap">
        {row.original.proformaNumber}
      </span>
    ),
  },

  {
    id: "customer",
    // Was missing — the header had a sort button that toggled a sort with no
    // underlying value, so clicking it did nothing.
    accessorFn: (row) => fullName(row),
    header: ({ column }) => <SortableHeader column={column} label="Customer" />,
    cell: ({ row }) => (
      <p className="font-medium text-sm whitespace-nowrap">
        {fullName(row.original) || "—"}
      </p>
    ),
  },

  {
    accessorKey: "dateCreated",
    header: ({ column }) => (
      <SortableHeader column={column} label="Creation Date" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.dateCreated)}
      </span>
    ),
  },

  {
    accessorKey: "expiresAt",
    header: ({ column }) => <SortableHeader column={column} label="Due Date" />,
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.expiresAt)}
      </span>
    ),
  },

  {
    accessorKey: "grossAmount",
    header: ({ column }) => (
      <SortableHeader column={column} label="Gross Amount" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-sm whitespace-nowrap">
        {formatCurrency(row.original.grossAmount ?? 0)}
      </span>
    ),
  },

  {
    id: "discount",
    /**
     * No `accessorKey: "totalDiscountAmount"` here on purpose. That field is 0
     * on the wire even when a manual discount exists, so sorting by it would
     * order rows by a value the cell isn't displaying. Sort by the resolved
     * figure instead.
     */
    accessorFn: (row) => resolveDiscount(row),
    header: ({ column }) => <SortableHeader column={column} label="Discount" />,
    cell: ({ row }) => {
      const discount = resolveDiscount(row.original);
      return (
        <span className="text-sm text-red-500 whitespace-nowrap">
          {discount > 0 ? `− ${formatCurrency(discount)}` : "—"}
        </span>
      );
    },
  },

  {
    id: "netAmount",
    /**
     * The old version computed `grossAmount - appliedDiscountAmount`, but
     * `appliedDiscountAmount` is null for a manual discount — so the net came
     * out equal to the gross and this table disagreed with the printed invoice.
     * `resolveTotals` is the same helper InvoiceDocument uses.
     */
    accessorFn: (row) => resolveTotals(row).netAmount,
    header: ({ column }) => (
      <SortableHeader column={column} label="Net Amount" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-sm whitespace-nowrap">
        {formatCurrency(resolveTotals(row.original).netAmount)}
      </span>
    ),
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
