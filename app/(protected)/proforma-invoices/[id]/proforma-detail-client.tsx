"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  ListChecks,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/helpers";
import ProformaForm from "@/components/forms/proforma-form";
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

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Total"
          value={proforma.totalAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Tax"
          value={proforma.taxAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={currency}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<ListChecks className="h-3 w-3" />}
          label="Line items"
          value={String(proforma.lines?.length ?? 0)}
        />
        <KpiCard
          icon={<FileText className="h-3 w-3" />}
          label="Valid until"
          value={dt(proforma.validUntil)}
          deltaTone="neutral"
        />
      </KpiStrip>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {isProformaShareable(proforma.status) && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => shareProforma(proforma.id))}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {proforma.shareToken ? "Re-share" : "Share"}
          </Button>
        )}
        {isProformaConvertible(proforma.status) && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setConfirmConvert(true)}
          >
            <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
            Convert to invoice
          </Button>
        )}
        {proforma.convertedInvoiceId && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/invoices/${proforma.convertedInvoiceId}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              View invoice
            </Link>
          </Button>
        )}
        {isProformaCancellable(proforma.status) && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-red-600 hover:text-red-700"
            disabled={isPending}
            onClick={() => setConfirmCancel(true)}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>

      {/* Public share link */}
      {shareUrl && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Customer link
              </p>
              <p className="truncate font-mono text-xs text-ink">{shareUrl}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button asChild size="sm" variant="ghost">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={canEdit ? "edit" : "summary"}>
        <TabsList>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
        </TabsList>

        {canEdit && (
          <TabsContent value="edit" className="mt-4">
            <ProformaForm item={proforma} defaultCurrency={currency} />
          </TabsContent>
        )}

        <TabsContent value="summary" className="mt-4 space-y-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Customer" value={proforma.customerName} />
              <DetailItem label="Phone" value={proforma.customerPhone ?? "—"} />
              <DetailItem label="Email" value={proforma.customerEmail ?? "—"} />
              <DetailItem label="TIN" value={proforma.customerTin ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit price</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Tax</th>
                      <th className="px-4 py-3 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {proforma.lines?.map((l) => (
                      <tr key={l.id ?? l.description} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">{l.description}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatMoney(l.unitPrice, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.lineDiscountAmount
                            ? formatMoney(l.lineDiscountAmount, currency)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.taxAmount ? formatMoney(l.taxAmount, currency) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium tabular-nums">
                          {formatMoney(l.lineTotal ?? 0, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <dl className="w-full max-w-xs space-y-1 font-mono text-sm tabular-nums">
                  <Row label="Subtotal" value={formatMoney(proforma.subtotalAmount, currency)} />
                  {proforma.discountAmount > 0 && (
                    <Row
                      label="Discount"
                      value={`−${formatMoney(proforma.discountAmount, currency)}`}
                    />
                  )}
                  <Row label="Tax" value={formatMoney(proforma.taxAmount, currency)} />
                  <div className="flex justify-between border-t border-line pt-1 text-base font-semibold text-ink">
                    <dt>Total</dt>
                    <dd>{formatMoney(proforma.totalAmount, currency)}</dd>
                  </div>
                </dl>
              </div>

              {proforma.notes && (
                <div className="mt-4 rounded-lg bg-surface/50 p-3 text-sm">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{proforma.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet.
                </div>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{e.eventType}</span>
                          {e.description ? ` — ${e.description}` : ""}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {new Date(e.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
