"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/helpers";
import { formatBillingDate, getInvoiceStatusMeta } from "./shared";
import { InvoiceViewDialog } from "./invoice-view-dialog";
import type { BillingInvoice, InvoiceStatus } from "@/types/billing/types";

interface InvoicesTabProps {
  invoices: BillingInvoice[];
  /** Required when callers want pay/cancel actions enabled inside the view dialog. */
  businessId?: string;
  locationId?: string;
  contactDefaults?: { email: string; phone: string };
}

const FILTER_OPTIONS: Array<{ id: "ALL" | InvoiceStatus; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "PAID", label: "Paid" },
  { id: "FAILED", label: "Failed" },
  { id: "REFUNDED", label: "Refunded" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function InvoicesTab({
  invoices,
  businessId,
  locationId,
  contactDefaults,
}: InvoicesTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = { ALL: invoices.length };
    for (const inv of invoices) byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
    return byStatus;
  }, [invoices]);

  const filtered = useMemo(() => {
    const list = filter === "ALL" ? invoices : invoices.filter((inv) => inv.status === filter);
    return [...list].sort(
      (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
    );
  }, [invoices, filter]);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        className="inline-flex w-full max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-card p-[3px]"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.id;
          const count = counts[opt.id] ?? 0;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(opt.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                active ? "bg-canvas text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded px-1 font-mono text-[10.5px] tabular-nums",
                  active ? "bg-line text-ink-2" : "bg-canvas text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-card py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-ink">No invoices match this filter</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Try a different status — paid invoices show up here as soon as a payment clears.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice) => {
                const meta = getInvoiceStatusMeta(invoice.status);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11.5px] font-medium text-ink-2">
                        {invoice.invoiceNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatBillingDate(invoice.invoiceDate)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatBillingDate(invoice.periodStart)} – {formatBillingDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium tabular-nums text-ink">
                        {formatMoney(invoice.totalAmount, invoice.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setOpenInvoiceId(invoice.id)}
                        aria-label={`View ${invoice.invoiceNumber}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceViewDialog
        open={openInvoiceId !== null}
        onOpenChange={(open) => !open && setOpenInvoiceId(null)}
        invoiceId={openInvoiceId}
        businessId={businessId}
        locationId={locationId}
        defaultEmail={contactDefaults?.email}
        defaultPhone={contactDefaults?.phone}
        onPaid={() => {
          setOpenInvoiceId(null);
          router.refresh();
        }}
        onCancelled={() => {
          setOpenInvoiceId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
