"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { exportSalesReportWorkbook } from "@/lib/actions/sales-report-export-actions";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface Props {
  from: string;
  to: string;
  disabled?: boolean;
}

/**
 * Exports the whole sales report — every tab as its own sheet — to a single
 * .xlsx workbook ("Excel tabs"). The workbook is built server-side over the
 * full period (the browser never holds the datasets) and returned as base64,
 * which we decode into a download here. A .csv can't carry multiple tabs, so
 * this is an Excel file rather than CSV.
 */
export function SalesReportExportButton({ from, to, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const { base64, filename } = await exportSalesReportWorkbook(from, to);
        // base64 → bytes → Blob (Blobs can't cross the server-action boundary).
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: XLSX_MIME });
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
    });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isPending}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-4 w-4" />
      )}
      Export Excel
    </Button>
  );
}
