"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  buildCashflowSummaryCsv,
  type CashflowSummaryExport,
} from "@/lib/reports/cashflow-csv";

interface Props extends CashflowSummaryExport {
  disabled?: boolean;
}

/**
 * Downloads the cashflow summary (statement + per-tender inflow) for the
 * selected period as a CSV. Everything is already computed on the page, so we
 * build the file in the browser from the props — no server round-trip — and
 * the export reflects exactly the period currently in view.
 */
export function CashflowExportButton({ disabled, ...data }: Props) {
  const handleExport = () => {
    try {
      const { csv, filename } = buildCashflowSummaryCsv(data);
      // Lead with a BOM so Excel reads UTF-8 without mangling accents.
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
      });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't export",
        description:
          error instanceof Error ? error.message : "Request failed",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled}
    >
      <Download className="mr-1.5 h-4 w-4" />
      Export CSV
    </Button>
  );
}
