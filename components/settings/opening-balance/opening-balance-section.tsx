"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getOpeningBalanceStatus } from "@/lib/actions/opening-balance-actions";
import { voidJournalEntry } from "@/lib/actions/journal-entry-actions";
import { formatNumber } from "@/lib/utils";
import type { ChartOfAccount } from "@/types/accounting-mapping/type";
import type { OpeningBalanceStatus } from "@/types/opening-balance/type";

import { RecordOpeningBalanceDialog } from "./record-opening-balance-dialog";

interface Props {
  accounts: ChartOfAccount[];
}

export function OpeningBalanceSection({ accounts }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState<OpeningBalanceStatus | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reload = async () => setStatus(await getOpeningBalanceStatus());
  useEffect(() => {
    reload();
  }, []);

  const obeAccountId = accounts.find((a) => a.code === "3200")?.id;
  const accountLabel = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    return a ? `${a.code} · ${a.name}` : id;
  };

  const onVoid = () =>
    startTransition(async () => {
      if (!status?.entryId) return;
      const result = await voidJournalEntry(status.entryId);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Voided" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        setVoidOpen(false);
        await reload();
      }
    });

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Opening balance</p>
          {status === null ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : status.posted ? (
            <p className="text-xs text-muted-foreground">
              Recorded as of {status.asOfDate}
              {status.entryNumber ? ` · ${status.entryNumber}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not recorded yet — set each account&apos;s starting balance.
            </p>
          )}
        </div>

        {status !== null && !status.posted && (
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            Record opening balance
          </Button>
        )}
        {status !== null && status.posted && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setViewOpen(true)}>
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVoidOpen(true)}>
              Void
            </Button>
          </div>
        )}
      </div>

      <RecordOpeningBalanceDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        suggestedAsOfDate={status?.suggestedAsOfDate}
        obeAccountId={obeAccountId}
        onRecorded={reload}
      />

      {/* View */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Opening balance{status?.entryNumber ? ` · ${status.entryNumber}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">As of {status?.asOfDate}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase text-gray-400">
                <th className="py-2">Account</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(status?.lines ?? []).map((l, i) => (
                <tr key={i}>
                  <td className="py-2">{accountLabel(l.chartOfAccountId)}</td>
                  <td className="py-2 text-right font-mono">
                    {l.debit ? formatNumber(l.debit) : "—"}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {l.credit ? formatNumber(l.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void confirm */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void opening balance?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This voids {status?.entryNumber ?? "the opening-balance entry"} and
            removes it from all reports. You can record a new opening balance
            afterwards.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setVoidOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onVoid} disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
