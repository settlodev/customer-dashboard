"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInvoiceView } from "@/lib/actions/billing-actions";
import { formatMoney } from "@/lib/helpers";
import { formatBillingDate, getInvoiceStatusMeta } from "./shared";
import type { InvoiceViewDto } from "@/types/billing/types";

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

export function InvoiceViewDialog({ open, onOpenChange, invoiceId }: InvoiceViewDialogProps) {
  const [invoice, setInvoice] = useState<InvoiceViewDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) {
      setInvoice(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getInvoiceView(invoiceId)
      .then((data) => {
        if (!cancelled) setInvoice(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  const statusMeta = invoice ? getInvoiceStatusMeta(invoice.status) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" overlayClassName="bg-foreground/30 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoice ? `Issued ${formatBillingDate(invoice.invoiceDate)}` : "Loading details…"}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {invoice && !loading && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {statusMeta && <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
              <div className="text-right">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Total
                </p>
                <p className="text-xl font-semibold tabular-nums text-ink">
                  {formatMoney(invoice.totalAmount, invoice.currency)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Period
                </p>
                <p className="mt-0.5 text-ink">
                  {formatBillingDate(invoice.periodStart)} – {formatBillingDate(invoice.periodEnd)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Due
                </p>
                <p className="mt-0.5 text-ink">{formatBillingDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  Billed to
                </p>
                <p className="mt-0.5 text-ink">{invoice.customerName || "—"}</p>
                {invoice.customerEmail && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {invoice.customerEmail}
                  </p>
                )}
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                  From
                </p>
                <p className="mt-0.5 text-ink">{invoice.sellerName || "—"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Line items
              </p>
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-canvas font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {invoice.items.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2 text-ink">
                          {line.description}
                          {line.isProration && (
                            <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                              (proration)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {line.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {line.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 rounded-lg border border-line bg-canvas px-4 py-3 text-sm">
              <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
              {invoice.discountAmount > 0 && (
                <Row
                  label={invoice.discountDescription ?? "Discount"}
                  value={`− ${formatMoney(invoice.discountAmount, invoice.currency)}`}
                  tone="pos"
                />
              )}
              {invoice.taxAmount > 0 && (
                <Row label="Tax" value={formatMoney(invoice.taxAmount, invoice.currency)} />
              )}
              <Separator className="my-1" />
              <Row
                label="Total"
                value={formatMoney(invoice.totalAmount, invoice.currency)}
                strong
              />
              {invoice.paidAt && (
                <Row label="Paid at" value={formatBillingDate(invoice.paidAt)} />
              )}
            </div>

            {invoice.notes && (
              <p className="rounded-lg border border-line bg-canvas px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {invoice.notes}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[11.5px] text-muted-foreground">{label}</span>
      <span
        className={
          (strong ? "text-base font-semibold text-ink " : "text-sm text-ink ") +
          (tone === "pos" ? "text-pos " : tone === "neg" ? "text-neg " : "") +
          "tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
