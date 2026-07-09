"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import type { TaxReportBreakdown, TaxReportRow } from "@/types/reports/tax";

const formatNum = (value: number | null | undefined, max = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

interface BuildColumnsOptions {
  breakdown: TaxReportBreakdown;
  multiCurrency: boolean;
}

export function buildTaxReportColumns({
  breakdown,
  multiCurrency,
}: BuildColumnsOptions): ColumnDef<TaxReportRow>[] {
  const columns: ColumnDef<TaxReportRow>[] = [
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => {
        const value = row.original.period;
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? value
          : format(date, "MMM d, yyyy");
      },
    },
    breakdown === "product"
      ? {
          accessorKey: "productName",
          header: "Product",
          cell: ({ row }) =>
            row.original.productName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            ),
        }
      : {
          accessorKey: "taxCode",
          header: "Tax code",
          cell: ({ row }) => {
            const code = row.original.taxCode;
            const name = row.original.taxName;
            if (!code) {
              return <span className="text-muted-foreground">Unclassified/exempt</span>;
            }
            return (
              <div className="flex flex-col">
                <span className="font-medium">{code}</span>
                {name && (
                  <span className="text-[11px] text-muted-foreground">{name}</span>
                )}
              </div>
            );
          },
        },
    {
      accessorKey: "taxableAmount",
      header: "Taxable amount",
      cell: ({ row }) => {
        const value = row.original.taxableAmount;
        if (!value || value <= 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <span className="tabular-nums">{formatNum(value)}</span>;
      },
    },
    {
      accessorKey: "taxAmount",
      header: "Tax amount",
      cell: ({ row }) => {
        const value = row.original.taxAmount;
        if (!value || value <= 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-medium tabular-nums">{formatNum(value)}</span>
        );
      },
    },
  ];

  if (multiCurrency) {
    columns.push({
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => row.original.currency,
    });
  }

  return columns;
}
