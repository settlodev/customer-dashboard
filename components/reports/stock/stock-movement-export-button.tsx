"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { buildItemLabel, fmtCost } from "@/lib/reports/stock-movement";
import { getStockMovementReport } from "@/lib/actions/stock-movement-report-actions";
import type {
  StockMovementReportRow,
  StockStatus,
} from "@/types/stock-movement-report/type";

// RFC 4180 escaping — quote a cell only if it contains a quote, comma, or newline.
const csvCell = (value: string | number): string => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const STATUS_TEXT: Record<StockStatus, string> = {
  ok: "OK",
  low: "Low",
  out: "Out of stock",
  dead: "Dead stock",
};

interface Props {
  from: string;
  to: string;
  asOf: string;
  search: string;
  lens: string;
  sort: string;
  currency: string;
  /** Current total rows — disables the button when there's nothing to export. */
  total: number;
}

/**
 * Exports the whole current filter (all pages), not just the visible page.
 * Re-queries the backend with a large page size — same approach as the sales
 * report — then builds a BOM-led UTF-8 CSV so Excel reads accents correctly.
 */
export function StockMovementExportButton({
  from,
  to,
  asOf,
  search,
  lens,
  sort,
  currency,
  total,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const report = await getStockMovementReport({
          from,
          to,
          asOf,
          page: 0,
          size: 10000,
          search: search || undefined,
          lens,
          sort: sort || undefined,
        });
        if (report.content.length === 0) {
          toast({
            variant: "destructive",
            title: "Nothing to export",
            description: "No rows match the current filters.",
          });
          return;
        }
        downloadCsv(report.content, currency, from, to);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't export",
          description: error instanceof Error ? error.message : "Request failed",
        });
      }
    });

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9"
      onClick={handleExport}
      disabled={isPending || total === 0}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}

function downloadCsv(
  rows: StockMovementReportRow[],
  currency: string,
  from: string,
  to: string,
) {
  const header = [
    "Item",
    "Product",
    "SKU",
    "Opening",
    "In",
    "Out",
    "Net",
    "Closing",
    `Avg cost (${currency})`,
    `Value (${currency})`,
    "Status",
    "Reserved",
    "Available",
    "Reorder point",
    "Daily use",
    "Days of cover",
    "Days idle",
    "Last movement",
  ];

  const body = rows.map((r) =>
    [
      buildItemLabel(r.stockName, r.variantName),
      r.stockName,
      r.sku ?? "",
      Math.round(r.opening),
      Math.round(r.qtyIn),
      Math.round(r.qtyOut),
      Math.round(r.net),
      Math.round(r.closing),
      fmtCost(r.avgCost),
      Math.round(r.value),
      STATUS_TEXT[r.status],
      Math.round(r.reserved),
      Math.round(r.available),
      r.reorderPoint ?? "",
      r.dailyUse ?? "",
      r.daysOfCover ?? "",
      r.daysIdle ?? "",
      r.lastMovementAt ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = [header.map(csvCell).join(","), ...body].join("\n");
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `stock-movement-${from}_to_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}
