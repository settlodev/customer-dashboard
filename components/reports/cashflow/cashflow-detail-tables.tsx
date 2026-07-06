"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  fmtAmount,
  type CashflowExpenseRow,
  type CashflowRefundRow,
  type CashflowTransactionRow,
} from "@/types/reports/cashflow";

// ─── Shared cell helpers ────────────────────────────────────────────
// The section reads as a ledger: mono tabular-nums for anything numeric,
// 12.5px ink for primary text, 10.5px muted for the sub-line — matching
// the summary/breakdown panels above it.

const timeCell = (iso: string | null, dateOnly?: string | null) => {
  if (iso) {
    return (
      <span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-muted-foreground">
        {format(new Date(iso), "MMM d, HH:mm")}
      </span>
    );
  }
  if (dateOnly) {
    return (
      <span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-muted-foreground">
        {format(new Date(dateOnly), "MMM d")}
      </span>
    );
  }
  return <span className="text-muted-2">—</span>;
};

const monoRef = (value: string | null) =>
  value ? (
    <span className="font-mono text-[12px] tabular-nums text-ink">{value}</span>
  ) : (
    <span className="text-muted-2">—</span>
  );

const person = (name: string | null) =>
  name?.trim() ? (
    <span className="text-[12.5px] text-ink">{name}</span>
  ) : (
    <span className="text-muted-2">—</span>
  );

const rightHeader = (label: string) => {
  const Header = () => <div className="text-right">{label}</div>;
  Header.displayName = `RightHeader(${label})`;
  return Header;
};

// ─── Payments ───────────────────────────────────────────────────────

/** Non-sale tender kinds worth calling out on the row. */
const PAYMENT_TYPE_TAGS: Record<string, string> = {
  COMPLIMENTARY: "Complimentary",
  SIGNED_BILL: "Signed bill",
};

const paymentColumns: ColumnDef<CashflowTransactionRow>[] = [
  {
    accessorKey: "transactionDate",
    header: "Time",
    cell: ({ row }) =>
      timeCell(row.original.transactionDate, row.original.businessDate),
  },
  {
    accessorKey: "orderNumber",
    header: "Receipt",
    cell: ({ row }) => monoRef(row.original.orderNumber),
  },
  {
    accessorKey: "acceptedPaymentMethodTypeName",
    header: "Method",
    cell: ({ row }) => {
      const name =
        row.original.acceptedPaymentMethodTypeName?.trim() || "Unknown";
      const tag = row.original.paymentType
        ? PAYMENT_TYPE_TAGS[row.original.paymentType]
        : undefined;
      return (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[12.5px] font-medium text-ink">
            {name}
          </span>
          {tag && (
            <span className="shrink-0 rounded-full border border-line bg-canvas px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.05em] text-muted-foreground">
              {tag}
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "staffName",
    header: "Staff",
    cell: ({ row }) => person(row.original.staffName),
  },
  {
    accessorKey: "amount",
    header: rightHeader("Amount"),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-mono text-[12.5px] tabular-nums text-ink">
          {fmtAmount(row.original.amount)}
        </span>
        {row.original.tipAmount > 0 && (
          <div className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            +{fmtAmount(row.original.tipAmount)} tip
          </div>
        )}
      </div>
    ),
  },
];

export function CashflowPaymentsTable({
  rows,
  pageCount,
  defaultPageSize,
  methodOptions,
}: {
  rows: CashflowTransactionRow[];
  pageCount: number;
  defaultPageSize: number;
  /** Tender filter choices — value is the acceptedPaymentMethodType id. */
  methodOptions: { label: string; value: string }[];
}) {
  return (
    <DataTable
      columns={paymentColumns}
      data={rows}
      searchKey="orderNumber"
      hideSearch
      pageCount={pageCount}
      defaultPageSize={defaultPageSize}
      manualFilter
      filterKey="method"
      filterOptions={methodOptions.length > 0 ? methodOptions : undefined}
    />
  );
}

// ─── Refunds ────────────────────────────────────────────────────────

const refundColumns: ColumnDef<CashflowRefundRow>[] = [
  {
    accessorKey: "refundDate",
    header: "Time",
    cell: ({ row }) =>
      timeCell(row.original.refundDate, row.original.businessDate),
  },
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <div className="min-w-0">
        {monoRef(row.original.orderNumber)}
        <div className="truncate text-[11px] text-muted-foreground">
          {row.original.orderItemName?.trim() || "—"}
          {row.original.quantity > 1 && (
            <span className="font-mono tabular-nums">
              {" "}
              × {Number(row.original.quantity).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-[260px]">
        <p
          className="truncate text-[12.5px] text-ink"
          title={row.original.reason ?? undefined}
        >
          {row.original.reason?.trim() || "—"}
        </p>
        {row.original.stockReturned && (
          <p className="font-mono text-[10.5px] text-muted-foreground">
            returned to stock
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "refundedByName",
    header: "Refunded by",
    cell: ({ row }) => person(row.original.refundedByName),
  },
  {
    accessorKey: "refundNetAmount",
    header: rightHeader("Amount"),
    cell: ({ row }) => (
      <div className="text-right font-mono text-[12.5px] tabular-nums text-neg">
        −{fmtAmount(row.original.refundNetAmount)}
      </div>
    ),
  },
];

export function CashflowRefundsTable({
  rows,
  pageCount,
  defaultPageSize,
}: {
  rows: CashflowRefundRow[];
  pageCount: number;
  defaultPageSize: number;
}) {
  return (
    <DataTable
      columns={refundColumns}
      data={rows}
      searchKey="orderNumber"
      hideSearch
      pageCount={pageCount}
      defaultPageSize={defaultPageSize}
    />
  );
}

// ─── Expenses ───────────────────────────────────────────────────────

const EXPENSE_STATUS_TONE: Record<string, string> = {
  PAID: "hsl(var(--pos))",
  PARTIALLY_PAID: "hsl(var(--warn))",
  UNPAID: "hsl(var(--neg))",
};

const expenseColumns: ColumnDef<CashflowExpenseRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => timeCell(null, row.original.date),
  },
  {
    accessorKey: "name",
    header: "Expense",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-[280px]">
        <p className="truncate text-[12.5px] font-medium text-ink">
          {row.original.name?.trim() || "Unnamed expense"}
        </p>
        {row.original.categoryName?.trim() && (
          <p className="truncate text-[11px] text-muted-foreground">
            {row.original.categoryName}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status?.trim() || "";
      if (!status) return <span className="text-muted-2">—</span>;
      const tone = EXPENSE_STATUS_TONE[status];
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: tone ?? "hsl(var(--muted-foreground))" }}
          />
          {status.replaceAll("_", " ").toLowerCase()}
        </span>
      );
    },
  },
  {
    accessorKey: "staffName",
    header: "Recorded by",
    cell: ({ row }) => person(row.original.staffName),
  },
  {
    accessorKey: "paidAmount",
    header: rightHeader("Paid"),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-mono text-[12.5px] tabular-nums text-ink">
          {fmtAmount(row.original.paidAmount)}
        </span>
        {row.original.unpaidAmount > 0 && (
          <div className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            of {fmtAmount(row.original.totalAmount)}
          </div>
        )}
      </div>
    ),
  },
];

export function CashflowExpensesTable({
  rows,
  pageCount,
  defaultPageSize,
}: {
  rows: CashflowExpenseRow[];
  pageCount: number;
  defaultPageSize: number;
}) {
  return (
    <DataTable
      columns={expenseColumns}
      data={rows}
      searchKey="name"
      hideSearch
      pageCount={pageCount}
      defaultPageSize={defaultPageSize}
    />
  );
}

// ─── Failed-fetch fallback ──────────────────────────────────────────

/**
 * Compact in-card fallback for a failed line-item fetch (`null` from the
 * action — distinct from an empty page, which the table renders itself).
 * `DataLoadError` is full-page scale; this stays at section scale.
 */
export function CashflowDetailError({ itemName }: { itemName: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-canvas px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load {itemName} right now — this is usually temporary.
      </p>
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => startTransition(() => router.refresh())}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Try again
      </Button>
    </div>
  );
}
