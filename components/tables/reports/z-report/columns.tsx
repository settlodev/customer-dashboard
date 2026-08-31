"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { vfdSalesFigure } from "@/lib/z-report/aggregate";
import type { ZReportDayRow } from "@/types/reports/z-report";

const fmt = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const Dash = () => <span className="text-muted-foreground">—</span>;

/** Signed, with an explicit + so a positive delta reads as "local is higher". */
const fmtDelta = (value: number) =>
  `${value > 0 ? "+" : ""}${Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value)}`;

// Rounding noise between two systems that hold money at different scales is
// not a finding; anything under a shilling is shown as balanced.
const isBalanced = (value: number) => Math.abs(value) < 1;

const weekday = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "";
  // Constructed in local time deliberately: a `new Date("yyyy-MM-dd")` parses
  // as UTC and renders the previous weekday for anywhere east of Greenwich.
  // Locale is pinned rather than left to the runtime: this renders on the
  // server too, and a browser whose locale differs from Node's would hydrate
  // a different label.
  return new Date(y, m - 1, d).toLocaleDateString("en", { weekday: "short" });
};

interface BuildColumnsOptions {
  /** Hide every fiscal column when the location has no verified VFD device. */
  showVfd: boolean;
}

export function buildZReportColumns({
  showVfd,
}: BuildColumnsOptions): ColumnDef<ZReportDayRow>[] {
  const columns: ColumnDef<ZReportDayRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <Link
          href={`/report/z-report/${row.original.date}`}
          className="flex flex-col hover:underline"
        >
          <span className="font-medium">{row.original.date}</span>
          <span className="text-[11px] text-muted-foreground">
            {weekday(row.original.date)}
          </span>
        </Link>
      ),
    },
    {
      id: "sessions",
      header: "Sessions",
      accessorFn: (row) => row.local?.sessionCount ?? 0,
      cell: ({ row }) => {
        const local = row.original.local;
        if (!local) {
          // A fiscal Z with no session behind it — the drift this report is
          // for, so it gets words rather than a dash.
          return (
            <span className="text-[11px] font-medium text-warn">
              No session
            </span>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="tabular-nums">{local.sessionCount}</span>
            {local.openSessionCount > 0 && (
              <span className="text-[11px] text-warn">
                {local.openSessionCount} open
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "orderCount",
      header: "Orders",
      accessorFn: (row) => row.local?.orderCount ?? 0,
      cell: ({ row }) =>
        row.original.local ? (
          <span className="tabular-nums">
            {fmt(row.original.local.orderCount)}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      id: "net",
      header: "Net sales",
      accessorFn: (row) => row.local?.net ?? 0,
      cell: ({ row }) =>
        row.original.local ? (
          <span className="font-medium tabular-nums">
            {fmt(row.original.local.net)}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      id: "tax",
      header: "Tax",
      accessorFn: (row) => row.local?.taxAmount ?? 0,
      cell: ({ row }) => {
        const value = row.original.local?.taxAmount;
        return value ? (
          <span className="tabular-nums">{fmt(value)}</span>
        ) : (
          <Dash />
        );
      },
    },
  ];

  if (!showVfd) return columns;

  columns.push(
    {
      id: "vfdReceipts",
      header: "Receipts (VFD)",
      accessorFn: (row) => row.vfd?.totalReceipt ?? 0,
      cell: ({ row }) =>
        row.original.vfd ? (
          <span className="tabular-nums">
            {fmt(row.original.vfd.totalReceipt)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">No Z</span>
        ),
    },
    {
      id: "vfdSales",
      header: "Sales (VFD)",
      accessorFn: (row) => (row.vfd ? vfdSalesFigure(row.vfd) : 0),
      cell: ({ row }) =>
        row.original.vfd ? (
          <span className="font-medium tabular-nums">
            {fmt(vfdSalesFigure(row.original.vfd))}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      id: "vfdTax",
      header: "Tax (VFD)",
      accessorFn: (row) => row.vfd?.totalTax ?? 0,
      cell: ({ row }) => {
        const value = row.original.vfd?.totalTax;
        return value ? (
          <span className="tabular-nums">{fmt(value)}</span>
        ) : (
          <Dash />
        );
      },
    },
    {
      id: "salesVariance",
      header: "Δ Sales",
      accessorFn: (row) => row.variance?.sales ?? 0,
      cell: ({ row }) => {
        const variance = row.original.variance;
        if (!variance) {
          return (
            <span
              className="text-[11px] text-muted-foreground"
              title="Both sides need a row for the same date before a difference means anything."
            >
              n/a
            </span>
          );
        }
        const balanced = isBalanced(variance.sales);
        return (
          <span
            className={cn(
              "tabular-nums",
              balanced ? "text-muted-foreground" : "font-medium text-warn",
            )}
            title={
              balanced
                ? "Local and fiscal sales agree."
                : "Sales the POS billed that the device did not ring up (or the reverse). Late-night sessions post receipts under the next fiscal date, so some drift is expected."
            }
          >
            {balanced ? "0" : fmtDelta(variance.sales)}
          </span>
        );
      },
    },
    {
      id: "receiptVariance",
      header: "Δ Receipts",
      accessorFn: (row) => row.variance?.receipts ?? 0,
      cell: ({ row }) => {
        const variance = row.original.variance;
        if (!variance) return <Dash />;
        const balanced = variance.receipts === 0;
        return (
          <span
            className={cn(
              "tabular-nums",
              balanced ? "text-muted-foreground" : "font-medium text-warn",
            )}
            title={
              balanced
                ? "Every order has a fiscal receipt."
                : "Orders billed locally without a matching fiscal receipt (positive), or fiscal receipts with no local order (negative)."
            }
          >
            {balanced ? "0" : fmtDelta(variance.receipts)}
          </span>
        );
      },
    },
  );

  return columns;
}
