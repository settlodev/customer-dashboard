"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getVariantMovementsAll } from "@/lib/actions/stock-movement-actions";
import { buildMovementLedgerCsv } from "@/lib/stock-movement-csv";

interface Props {
  locationId: string;
  variantId: string;
  /** Item name as shown on the page — used in the filename. */
  variantLabel: string;
  /** yyyy-MM-dd bounds as sent to the backend (the "all time" floor included). */
  startDate: string;
  endDate?: string;
  /** The period as the user picked it — "" for all time — for the filename. */
  range: { from: string; to: string };
  /** Movement type filter, or undefined for every type. */
  movementType?: string;
  currency: string;
  /** Actor id → display name, keyed by both staff id and auth id. */
  staffNames: Record<string, string>;
  /** Rows matching the current filter — disables the button when nothing would export. */
  total: number;
  disabled?: boolean;
}

/**
 * Downloads the ledger the operator is looking at — this variant, the selected
 * period and movement type — as CSV. Drains every page of the filter, not just
 * the one on screen, then builds the file in the browser with the same labels
 * and integrity checks the table renders.
 */
export function MovementLedgerExportButton({
  locationId,
  variantId,
  variantLabel,
  startDate,
  endDate,
  range,
  movementType,
  currency,
  staffNames,
  total,
  disabled,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const { rows, truncated } = await getVariantMovementsAll({
          locationId,
          variantId,
          startDate,
          endDate,
          movementType,
        });
        if (rows.length === 0) {
          toast({
            variant: "destructive",
            title: "Nothing to export",
            description: "No movements match the current filters.",
          });
          return;
        }
        const { csv, filename } = buildMovementLedgerCsv({
          rows,
          variantLabel,
          currency,
          from: range.from,
          to: range.to,
          staffNames,
        });
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
        toast({
          title: truncated ? "Export capped" : "Movements export ready",
          description: truncated
            ? `${filename} holds the newest ${rows.length.toLocaleString()} entries only — narrow the period to export the rest.`
            : `${filename} · ${rows.length.toLocaleString()} entries`,
          ...(truncated && { variant: "destructive" as const }),
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't export movements",
          description:
            error instanceof Error ? error.message : "Request failed",
        });
      }
    });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 text-[12.5px]"
      onClick={handleExport}
      disabled={disabled || isPending || total === 0}
      title="Download every entry matching the current period and type filter"
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-3.5 w-3.5" />
      )}
      Export CSV
    </Button>
  );
}
