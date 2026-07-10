"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { useToast } from "@/hooks/use-toast";
import { postOpeningBalance } from "@/lib/actions/opening-balance-actions";
import { computeOpeningBalanceResidual } from "@/lib/opening-balance";
import { formatNumber } from "@/lib/utils";
import type { ChartOfAccount, AccountType } from "@/types/accounting-mapping/type";

const BALANCE_SHEET_TYPES: AccountType[] = ["ASSET", "LIABILITY", "EQUITY"];

interface Row {
  key: string;
  chartOfAccountId: string;
  account: ChartOfAccount | null;
  amount: number | undefined;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedAsOfDate?: string | null;
  /** The system 3200 account id, if it exists — hidden from the picker. */
  obeAccountId?: string;
  onRecorded: () => void;
}

export function RecordOpeningBalanceDialog({
  open,
  onOpenChange,
  suggestedAsOfDate,
  obeAccountId,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [asOfDate, setAsOfDate] = useState<string>(suggestedAsOfDate ?? "");
  const keyCounter = useRef(1);
  const [rows, setRows] = useState<Row[]>([
    { key: "r0", chartOfAccountId: "", account: null, amount: undefined },
  ]);

  // Reset to a fresh blank form each time the dialog opens, seeding the
  // as-of date from the (now-loaded) suggestion. The dialog is always mounted
  // and toggled via `open`, so without this the initial useState seed
  // (captured before status loads) leaves the date blank and shows stale rows
  // on reopen. While open, status cannot change, so this won't reset mid-edit.
  useEffect(() => {
    if (!open) return;
    setAsOfDate(suggestedAsOfDate ?? "");
    keyCounter.current = 1;
    setRows([{ key: "r0", chartOfAccountId: "", account: null, amount: undefined }]);
  }, [open, suggestedAsOfDate]);

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      {
        key: `r${keyCounter.current++}`,
        chartOfAccountId: "",
        account: null,
        amount: undefined,
      },
    ]);

  const removeRow = (key: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const previewLines = rows
    .filter((r) => r.account && typeof r.amount === "number" && r.amount !== 0)
    .map((r) => ({
      normalBalance: r.account!.normalBalance,
      amount: r.amount as number,
    }));
  const residual = computeOpeningBalanceResidual(previewLines);

  const validRows = rows.filter(
    (r) => r.chartOfAccountId && typeof r.amount === "number" && r.amount !== 0,
  );

  const submit = () =>
    startTransition(async () => {
      const result = await postOpeningBalance({
        asOfDate: asOfDate || undefined,
        lines: validRows.map((r) => ({
          chartOfAccountId: r.chartOfAccountId,
          amount: r.amount as number,
        })),
      });
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Recorded" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        onRecorded();
        onOpenChange(false);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record opening balances</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-w-[220px]">
            <Label>As of date</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The day your books start — usually just before your first recorded
              transaction. Pre-filled with our suggestion.
            </p>
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => {
              const excludeIds = [
                ...rows
                  .filter((_, i) => i !== idx)
                  .map((r) => r.chartOfAccountId)
                  .filter(Boolean),
                ...(obeAccountId ? [obeAccountId] : []),
              ];
              return (
                <div key={row.key} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ChartOfAccountSelector
                      accountTypes={BALANCE_SHEET_TYPES}
                      excludeIds={excludeIds}
                      value={row.chartOfAccountId}
                      placeholder="Select account"
                      onChange={(id, account) =>
                        patchRow(row.key, { chartOfAccountId: id, account })
                      }
                    />
                  </div>
                  <div className="w-40">
                    <NumericInput
                      value={row.amount ?? null}
                      onChange={(v) => patchRow(row.key, { amount: v })}
                      allowNegative
                      decimalScale={2}
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove line"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
            <Button variant="outline" size="sm" type="button" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add account
            </Button>
          </div>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {residual ? (
              <>
                Balances to{" "}
                <span className="font-medium">Opening Balance Equity</span>:{" "}
                <span className="font-mono">{formatNumber(residual.amount)}</span>{" "}
                ({residual.side === "CREDIT" ? "Cr" : "Dr"})
              </>
            ) : (
              <span className="text-muted-foreground">
                Entered balances net to zero — no equity adjustment.
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isPending || validRows.length === 0}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Post opening balances
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
