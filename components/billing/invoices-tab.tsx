"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ReceiptText } from "lucide-react";
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
import { StatusPill, toPillTone } from "./pill";
import { formatAmount, formatBillingDate, getInvoiceStatusMeta } from "./shared";
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
    <div className="space-y-[18px]">
      {/* Same segmented vocabulary as the dashboard's date-range control
          and the billing tabs above — hairline card shell, 28px segments,
          primary fill on the active one. */}
      <div
        role="tablist"
        aria-label="Filter invoices by status"
        className="inline-flex w-full max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] border border-line-2 bg-card p-[3px] sm:w-fit"
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
                "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded-[5px] px-1.5 py-px font-mono text-[10.5px] font-semibold tabular-nums",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-canvas text-muted-foreground",
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
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-canvas">
            <ReceiptText className="h-5 w-5 text-muted-2" />
          </div>
          <p className="text-sm font-medium text-ink">No invoices match this filter</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Try a different status — paid invoices show up here as soon as a payment clears.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(20,17,12,0.03)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-11 px-5">Invoice</TableHead>
                <TableHead className="h-11 px-5">Issued</TableHead>
                <TableHead className="h-11 px-5">Period</TableHead>
                <TableHead className="h-11 px-5 text-right">Amount</TableHead>
                <TableHead className="h-11 px-5">Status</TableHead>
                <TableHead className="h-11 w-[72px] px-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice) => {
                const meta = getInvoiceStatusMeta(invoice.status);
                const isZero = invoice.totalAmount === 0;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="px-5 py-4">
                      <span className="inline-block rounded-[7px] border border-line bg-canvas px-2.5 py-1.5 font-mono text-[12.5px] font-semibold text-ink">
                        {invoice.invoiceNumber}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 font-mono text-[13px] text-ink-3">
                      {formatBillingDate(invoice.invoiceDate)}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-mono text-[13px] text-ink-3">
                      {formatBillingDate(invoice.periodStart)} –{" "}
                      {formatBillingDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <span
                        className={cn(
                          "font-mono text-[13.5px] tabular-nums",
                          isZero
                            ? "font-medium text-muted-2"
                            : "font-semibold text-ink",
                        )}
                      >
                        {formatAmount(invoice.totalAmount)} {invoice.currency}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <StatusPill tone={toPillTone(meta.variant)}>
                        {meta.label}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8 rounded-lg text-muted-foreground hover:bg-canvas hover:text-ink"
                        onClick={() => setOpenInvoiceId(invoice.id)}
                        aria-label={`View ${invoice.invoiceNumber}`}
                      >
                        <Eye className="h-4 w-4" />
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
