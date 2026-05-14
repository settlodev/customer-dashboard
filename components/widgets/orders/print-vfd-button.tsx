"use client";

import { UUID } from "node:crypto";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { printOrderVfd } from "@/lib/actions/order-actions";
import type { VfdPrintResponse } from "@/types/orders/type";

const formatTs = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function PrintVfdButton({
  orderId,
  orderNumber,
}: {
  orderId: UUID;
  orderNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPrinting, startPrint] = useTransition();
  const [result, setResult] = useState<VfdPrintResponse | null>(null);

  const isStub = result?.accountingServiceStatus === "STUBBED";

  const handlePrint = () => {
    startPrint(async () => {
      const res = await printOrderVfd(orderId);
      if ("error" in res) {
        toast({
          variant: "destructive",
          title: "Couldn't print VFD receipt",
          description: res.error,
        });
        return;
      }
      setResult(res.vfd);
      toast({ title: "VFD receipt issued" });
    });
  };

  const handleOpen = () => {
    setOpen(true);
    setResult(null);
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outline" size="sm">
        <Printer className="mr-1.5 h-4 w-4" />
        Print VFD
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setResult(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print VFD receipt</DialogTitle>
            <DialogDescription>
              Issue a Verified Fiscal Device receipt for order #{orderNumber}.
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-3 py-2 text-sm text-muted-foreground">
              <p>
                A fiscal slip will be requested from the on-site VFD device
                via the Accounting Service.
              </p>
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs">
                  VFD integration is currently a placeholder — the
                  response will be a stubbed fiscal number until the
                  Accounting Service ships the real device hookup.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">VFD receipt recorded</span>
              </div>
              <dl className="space-y-2 rounded-md border border-line bg-card p-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Fiscal number</dt>
                  <dd className="font-mono">
                    {result.fiscalReceiptNumber ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Device serial</dt>
                  <dd className="font-mono">
                    {result.fiscalDeviceSerial ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Signed at</dt>
                  <dd>{formatTs(result.signedAt) ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={
                        isStub
                          ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : "rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }
                    >
                      {result.accountingServiceStatus ?? "—"}
                    </span>
                  </dd>
                </div>
              </dl>
              {result.message && (
                <p className="text-xs text-muted-foreground">
                  {result.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {!result ? (
              <Button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                size="sm"
              >
                {isPrinting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-1.5 h-4 w-4" />
                )}
                Issue VFD receipt
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
