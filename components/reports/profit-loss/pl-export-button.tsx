"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { exportProfitLossWorkbook } from "@/lib/actions/pl-report-export-actions";
import type { PlView } from "@/lib/pl-period";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface Props {
  view: PlView;
  from: string;
  to: string;
  disabled?: boolean;
}

/**
 * Exports the P&L currently on screen — the same view and period the page
 * resolved from its URL — to a single-sheet .xlsx. Built server-side and
 * returned as base64, which we decode into a download here, exactly like
 * the sales report's export button.
 */
export function PlExportButton({ view, from, to, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const { base64, filename } = await exportProfitLossWorkbook(view, from, to);
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
