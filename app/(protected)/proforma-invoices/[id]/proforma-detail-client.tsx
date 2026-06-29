"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/helpers";
import { ProformaTotalsRows } from "@/components/invoicing/totals-rows";
import ProformaForm from "@/components/forms/proforma-form";
import formStyles from "@/components/forms/styles/form-shell.module.css";
import {
  cancelProforma,
  convertProforma,
  shareProforma,
} from "@/lib/actions/invoicing-proforma-actions";
import {
  isProformaCancellable,
  isProformaConvertible,
  isProformaEditable,
  isProformaShareable,
  PROFORMA_STATUS_LABELS,
  PROFORMA_STATUS_TONES,
  type DocTotals,
  type InvoicingEvent,
  type Proforma,
} from "@/types/invoicing/type";

interface Props {
  proforma: Proforma;
  timeline: InvoicingEvent[];
}

const dt = (d?: string | null) =>
  d ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d)) : "—";

export function ProformaDetailClient({ proforma, timeline }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [copied, setCopied] = useState(false);

  const currency = proforma.currencyCode;
  const canEdit = isProformaEditable(proforma.status);

  const totals: DocTotals = {
    subtotalAmount: proforma.subtotalAmount,
    discountAmount: proforma.discountAmount,
    taxAmount: proforma.taxAmount,
    totalAmount: proforma.totalAmount,
  };

  const run = (fn: () => Promise<{ responseType: string; message: string }>) =>
    startTransition(async () => {
      const result = await fn();
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  const convert = () =>
    startTransition(async () => {
      const result = await convertProforma(proforma.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Converted" : "Error",
        description: result.message,
      });
      if (result.responseType === "success" && result.data?.id) {
        router.push(`/invoices/${result.data.id}`);
      }
    });

  const shareUrl =
    proforma.shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/proforma/${proforma.shareToken}`
      : null;

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  // The rail cards beneath the live/saved "Total due" card — document actions,
  // details, customer link, cancel. Same content across every tab.
  const railExtra = (
    <>
      <div className="space-y-2 rounded-xl border border-line bg-card p-4">
        {isProformaShareable(proforma.status) && (
          <Button
            className="w-full justify-center"
            disabled={isPending}
            onClick={() => run(() => shareProforma(proforma.id))}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {proforma.shareToken ? "Re-share" : "Share"}
          </Button>
        )}
        {isProformaConvertible(proforma.status) && (
          <Button
            variant="outline"
            className="w-full justify-center"
            disabled={isPending}
            onClick={() => setConfirmConvert(true)}
          >
            <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
            Convert to invoice
          </Button>
        )}
        {proforma.convertedInvoiceId && (
          <Button asChild variant="outline" className="w-full justify-center">
            <Link href={`/invoices/${proforma.convertedInvoiceId}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              View invoice
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-line bg-card p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          Details
        </div>
        <div className="space-y-2.5">
          <RailRow label="Status" value={<StatusPill status={proforma.status} />} />
          <RailRow label="Valid until" value={dt(proforma.validUntil)} />
          <RailRow label="Line items" value={String(proforma.lines?.length ?? 0)} />
          <RailRow label="Currency" value={currency} />
        </div>
      </div>

      {shareUrl && (
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Customer link
          </div>
          <p className="break-all font-mono text-[11.5px] leading-relaxed text-ink-2">
            {shareUrl}
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-center"
              onClick={copyLink}
            >
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild size="sm" variant="ghost" className="flex-1 justify-center">
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open
              </a>
            </Button>
          </div>
        </div>
      )}

      {isProformaCancellable(proforma.status) && (
        <Button
          variant="ghost"
          className="w-full justify-center text-neg hover:bg-neg/10 hover:text-neg"
          disabled={isPending}
          onClick={() => setConfirmCancel(true)}
        >
          <Ban className="mr-1.5 h-3.5 w-3.5" />
          Cancel proforma
        </Button>
      )}
    </>
  );

  // Static rail (Summary / Timeline tabs) — saved total + the shared cards.
  const staticRail = (
    <aside
      className={cn(formStyles.formStack, "lg:sticky lg:top-4 lg:self-start")}
    >
      <div className="rounded-xl border border-ink bg-ink p-4 text-white">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-white/55">
          Total due
        </div>
        <ProformaTotalsRows totals={totals} currency={currency} accent />
      </div>
      {railExtra}
    </aside>
  );

  return (
    <>
      <Tabs defaultValue={canEdit ? "edit" : "summary"}>
        <TabsList>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
        </TabsList>

        {canEdit && (
          <TabsContent value="edit" className="mt-5">
            <ProformaForm
              item={proforma}
              defaultCurrency={currency}
              railExtra={railExtra}
            />
          </TabsContent>
        )}

        <TabsContent value="summary" className="mt-5">
          <div className={formStyles.formGrid}>
            <div className={formStyles.formStack}>
              <div className="rounded-xl border border-line bg-card p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <RoField label="Customer" value={proforma.customerName} />
                  <RoField label="Phone" value={proforma.customerPhone ?? "—"} />
                  <RoField label="Email" value={proforma.customerEmail ?? "—"} />
                  <RoField label="TIN" value={proforma.customerTin ?? "—"} />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-line bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Unit price</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                        <th className="px-4 py-3 text-right">Tax</th>
                        <th className="px-4 py-3 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {proforma.lines?.map((l) => (
                        <tr key={l.id ?? l.description}>
                          <td className="px-4 py-3 font-medium">{l.description}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {l.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {formatMoney(l.unitPrice, currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-2">
                            {l.lineDiscountAmount
                              ? formatMoney(l.lineDiscountAmount, currency)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-2">
                            {l.taxAmount ? formatMoney(l.taxAmount, currency) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                            {formatMoney(l.lineTotal ?? 0, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {proforma.notes && (
                <div className="rounded-xl border border-line bg-card p-4 text-sm">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap text-ink-2">{proforma.notes}</p>
                </div>
              )}
            </div>
            {staticRail}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-5">
          <div className={formStyles.formGrid}>
            <div className="min-w-0 rounded-xl border border-line bg-card p-4 sm:p-5">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet.
                </div>
              ) : (
                <ol className="space-y-1">
                  {timeline.map((e, i) => (
                    <li key={e.id} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border border-line bg-canvas text-ink-2">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        {i < timeline.length - 1 && (
                          <span className="my-1 w-px flex-1 bg-line" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 pt-0.5">
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          {e.eventType}
                        </div>
                        {e.description && (
                          <div className="mt-1 text-sm font-medium text-ink">
                            {e.description}
                          </div>
                        )}
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {new Date(e.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            {staticRail}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to an invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {proforma.proformaNumber} will be issued as an invoice and the
              receivable posted to the ledger. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={convert}>
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this proforma?</AlertDialogTitle>
            <AlertDialogDescription>
              {proforma.proformaNumber} will be marked CANCELLED. Any stock
              reservation it held is released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Keep proforma
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => run(() => cancelProforma(proforma.id))}
            >
              Cancel proforma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-[12.5px] font-semibold text-ink-2">
        {value}
      </span>
    </div>
  );
}

function RoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Proforma["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PROFORMA_STATUS_TONES[status],
      )}
    >
      {PROFORMA_STATUS_LABELS[status]}
    </span>
  );
}
