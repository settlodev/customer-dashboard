"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Download,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  StockBatchSummary,
} from "@/types/traceability/type";
import {
  downloadRecallRegisterCsv,
  fetchRecallRegister,
} from "@/lib/actions/traceability-actions";

const PAGE_SIZE = 50;

function toIsoAtStart(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
}

function toIsoAtEnd(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
}

export function RecallRegister() {
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>("");
  const [rows, setRows] = useState<StockBatchSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, startDownload] = useTransition();
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const load = (nextPage: number) => {
    startTransition(async () => {
      const res = await fetchRecallRegister(
        toIsoAtStart(from),
        toIsoAtEnd(to),
        nextPage,
        PAGE_SIZE,
      );
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't load register",
          description: res.message,
        });
        setRows([]);
        setTotal(0);
        return;
      }
      setRows(res.data?.items ?? []);
      setTotal(res.data?.totalElements ?? 0);
      setPage(nextPage);
    });
  };

  // Initial load on mount + whenever the date filters change.
  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const exportCsv = () => {
    startDownload(async () => {
      const res = await downloadRecallRegisterCsv(
        toIsoAtStart(from),
        toIsoAtEnd(to),
      );
      if (res.responseType === "error" || !res.data) {
        toast({
          variant: "destructive",
          title: "Download failed",
          description: res.message,
        });
        return;
      }
      // Data is base64-encoded by the server action; decode and trigger a
      // browser download so compliance officers get a real file, not a paste.
      const bin = atob(res.data.data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="reg-from" className="text-xs">
              From
            </Label>
            <Input
              id="reg-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <Label htmlFor="reg-to" className="text-xs">
              To
            </Label>
            <Input
              id="reg-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={isDownloading || rows.length === 0}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No recalls in this date range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Recalled at
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Batch
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Variant
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {b.recalledAt
                        ? new Date(b.recalledAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        href={`/stock-batches/${b.id}`}
                        className="hover:underline"
                      >
                        {b.batchNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {b.stockVariantDisplayName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(b.initialQuantity ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_TONES[b.status]}`}
                      >
                        {BATCH_STATUS_LABELS[b.status]}
                      </span>
                      {b.recallRevertedAt && (
                        <div className="mt-0.5 text-xs text-amber-700">
                          reverted{" "}
                          {new Date(b.recallRevertedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground italic max-w-[24rem]">
                      {b.recallReason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 text-xs border-t">
                <span className="text-muted-foreground">
                  Page {page + 1} of {totalPages} — {total.toLocaleString()} entries
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canPrev && load(page - 1)}
                    disabled={!canPrev || isPending}
                  >
                    <ChevronsLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canNext && load(page + 1)}
                    disabled={!canNext || isPending}
                  >
                    Next <ChevronsRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
