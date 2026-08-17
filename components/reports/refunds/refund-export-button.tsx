"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  buildRefundSummaryCsv,
  type RefundSummaryExport,
} from "@/lib/reports/refunds-csv";

interface Props extends RefundSummaryExport {
  disabled?: boolean;
}

/**
 * Downloads the refunds summary (headline totals + every breakdown) for the
 * selected period as a CSV. Built in the browser from the props the page
 * already rendered, so the file always matches what's on screen.
 */
export function RefundExportButton({ disabled, ...data }: Props) {
  const handleExport = () => {
    try {
      const { csv, filename } = buildRefundSummaryCsv(data);
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
        description: error instanceof Error ? error.message : "Request failed",
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled}>
      <Download className="mr-1.5 h-4 w-4" />
      Export CSV
    </Button>
  );
}
