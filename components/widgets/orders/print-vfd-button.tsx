"use client";

import { UUID } from "node:crypto";
import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, Printer } from "lucide-react";

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

  const verificationCode = result?.receipt?.data?.traReceiptVerificationCode;

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
                A fiscal receipt will be requested from the location&apos;s
                registered VFD device and permanently recorded against this
                order. Reprinting later returns the same signed receipt.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">VFD receipt issued</span>
              </div>
              <dl className="space-y-2 rounded-md border border-line bg-card p-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Fiscal number</dt>
                  <dd className="font-mono">
                    {result.fiscalReceiptNumber ?? "—"}
                  </dd>
                </div>
                {verificationCode && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Verification code
                    </dt>
                    <dd className="font-mono">{verificationCode}</dd>
                  </div>
                )}
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
              <>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/orders/${orderId}/vfd`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Open printable receipt
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
