"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ban,
  Check,
  Copy,
  ExternalLink,
  HandCoins,
  Link2,
  Receipt,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  cancelCustomerArInvoice,
  recordCustomerArInvoicePayment,
  shareCustomerArInvoice,
} from "@/lib/actions/customer-ar-invoice-actions";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import type { CustomerArInvoice } from "@/types/customer-ar-invoice/type";
import type { PaymentMethod } from "@/types/payments/type";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "—";

export function ArInvoiceDetailClient({
  invoice,
}: {
  invoice: CustomerArInvoice;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [amount, setAmount] = useState(String(invoice.outstandingAmount));
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [shareToken, setShareToken] = useState(invoice.shareToken ?? null);
  const [copied, setCopied] = useState(false);

  const cancelled = invoice.status === "CANCELLED";
  const settled = invoice.outstandingAmount <= 0;

  // Branch, street, then "City, Region, Country" — blanks dropped so a
  // half-filled business profile doesn't leave stray commas or empty rows.
  const issuerLines = [
    invoice.locationName &&
    invoice.locationName.trim() !== invoice.businessName?.trim()
      ? invoice.locationName
      : null,
    invoice.locationAddress,
    [invoice.locationCity, invoice.locationRegion, invoice.issuerCountry]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(", ") || null,
    [invoice.issuerPhone, invoice.issuerEmail].filter(Boolean).join(" · ") ||
      null,
  ].filter((l): l is string => Boolean(l && l.trim()));

  // Signed-bill and complimentary methods can't collect — the backend
  // rejects them, so they never appear as options.
  useEffect(() => {
    if (!payOpen || methods.length > 0) return;
    fetchLocationPaymentMethods()
      .then((all) =>
        setMethods(
          all.filter(
            (m) =>
              m.enabled &&
              !m.signedBillEquivalent &&
              !m.complimentaryEquivalent,
          ),
        ),
      )
      .catch(() => setMethods([]));
  }, [payOpen, methods.length]);

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/ar-invoice/${shareToken}`
    : null;

  const doShare = () => {
    startTransition(async () => {
      const result = await shareCustomerArInvoice(invoice.id);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not create link",
          description: result.message,
        });
        return;
      }
      setShareToken(result.data?.shareToken ?? null);
      toast({ title: "Share link ready" });
    });
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const doPay = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    if (!paymentMethodId) {
      toast({ variant: "destructive", title: "Choose a payment method" });
      return;
    }
    startTransition(async () => {
      const result = await recordCustomerArInvoicePayment({
        invoiceId: invoice.id,
        amount: value,
        paymentMethodId,
        note,
      });
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Payment not recorded",
          description: result.message,
        });
        return;
      }
      toast({ title: "Payment recorded", description: result.message });
      setPayOpen(false);
      setNote("");
      router.refresh();
    });
  };

  const doCancel = () => {
    startTransition(async () => {
      const result = await cancelCustomerArInvoice(invoice.id);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not cancel",
          description: result.message,
        });
        return;
      }
      toast({ title: "Invoice cancelled", description: result.message });
      setCancelOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Document ─────────────────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  From
                </div>
                <div className="mt-1 text-[15px] font-semibold text-ink">
                  {invoice.businessName ?? invoice.locationName ?? "—"}
                </div>
                {issuerLines.map((line) => (
                  <div key={line} className="text-[12px] text-muted-foreground">
                    {line}
                  </div>
                ))}
                {(invoice.issuerTin || invoice.issuerVrn) && (
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {invoice.issuerTin && <>TIN {invoice.issuerTin}</>}
                    {invoice.issuerTin && invoice.issuerVrn && " · "}
                    {invoice.issuerVrn && <>VRN {invoice.issuerVrn}</>}
                  </div>
                )}
              </div>
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Billed to
                </div>
                <div className="mt-1 text-[15px] font-semibold text-ink">
                  <Link
                    href={`/customers/${invoice.customerId}`}
                    className="hover:underline"
                  >
                    {invoice.customerName ?? "Customer"}
                  </Link>
                </div>
                {invoice.customerPhone && (
                  <div className="font-mono text-[12px] text-muted-foreground">
                    {invoice.customerPhone}
                  </div>
                )}
                {invoice.customerEmail && (
                  <div className="text-[12px] text-muted-foreground">
                    {invoice.customerEmail}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Issued
                </div>
                <div className="mt-1 font-mono text-[13px] text-ink">
                  {fmtDate(invoice.issueDate)}
                </div>
                {invoice.dueDate && (
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Due {fmtDate(invoice.dueDate)}
                  </div>
                )}
              </div>
            </div>

            {invoice.orders.map((order) => (
              <div
                key={order.orderId}
                className="overflow-hidden rounded-lg border border-line"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.orderId}`}
                      className="font-mono text-[12px] font-medium text-ink hover:underline"
                    >
                      {order.orderNumber ?? order.orderId.slice(0, 8)}
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {fmtDate(order.closedDate ?? order.openedDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {order.paidAmount > 0 && (
                      <span className="text-pos">
                        paid {fmt(order.paidAmount)}
                      </span>
                    )}
                    {order.writtenOffAmount > 0 && (
                      <span className="text-muted-foreground">
                        written off {fmt(order.writtenOffAmount)}
                      </span>
                    )}
                    <span
                      className={
                        order.outstandingAmount > 0
                          ? "font-medium text-neg"
                          : "text-pos"
                      }
                    >
                      {order.outstandingAmount > 0
                        ? `${fmt(order.outstandingAmount)} due`
                        : "cleared"}
                    </span>
                  </div>
                </div>
                <table className="w-full text-[13px]">
                  <tbody>
                    {order.items.length === 0 ? (
                      <tr>
                        <td className="px-3 py-2 text-[12px] text-muted-foreground">
                          No item detail available for this order.
                        </td>
                      </tr>
                    ) : (
                      order.items.map((item, i) => (
                        <tr
                          key={`${order.orderId}-${i}`}
                          className="border-b border-line last:border-0"
                        >
                          <td className="px-3 py-1.5">{item.name}</td>
                          <td className="w-20 px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                            {item.quantity} ×
                          </td>
                          <td className="w-28 px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                            {fmt(item.unitPrice)}
                          </td>
                          <td className="w-28 px-3 py-1.5 text-right font-mono tabular-nums">
                            {fmt(item.netAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between border-t border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                  <span>Order total</span>
                  <span className="tabular-nums">
                    {fmt(order.orderNetAmount)} {invoice.currency}
                  </span>
                </div>
              </div>
            ))}

            {invoice.notes && (
              <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                {invoice.notes}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Rail ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Balance due
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${
                    settled ? "text-pos" : "text-neg"
                  }`}
                >
                  {fmt(invoice.outstandingAmount)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {invoice.currency}
                </span>
              </div>
            </div>
            <dl className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Invoiced</dt>
                <dd className="font-mono tabular-nums">
                  {fmt(invoice.totalAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-mono tabular-nums text-pos">
                  {fmt(invoice.paidAmount)}
                </dd>
              </div>
              {invoice.writtenOffAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Written off</dt>
                  <dd className="font-mono tabular-nums">
                    {fmt(invoice.writtenOffAmount)}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Paid and outstanding are read live off the underlying orders —
              settle one at the till and it shows here too.
            </p>
          </CardContent>
        </Card>

        {!cancelled && (
          <Card>
            <CardContent className="space-y-2 pt-6">
              <Button
                className="w-full"
                onClick={() => setPayOpen(true)}
                disabled={isPending || settled}
              >
                <HandCoins className="mr-1.5 h-4 w-4" />
                {settled ? "Nothing outstanding" : "Record payment"}
              </Button>

              {shareToken ? (
                <div className="space-y-2 rounded-lg border border-line bg-surface p-2">
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Share link
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    /ar-invoice/{shareToken}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={copyLink}
                    >
                      {copied ? (
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/ar-invoice/${shareToken}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={doShare}
                  disabled={isPending}
                >
                  <Link2 className="mr-1.5 h-4 w-4" />
                  Share invoice
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCancelOpen(true)}
                disabled={isPending}
              >
                <Ban className="mr-1.5 h-4 w-4" />
                Cancel invoice
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-1.5 pt-6 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{invoice.locationName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bills</span>
              <span className="font-mono tabular-nums">
                {invoice.orders.length}
              </span>
            </div>
            {invoice.customerAccountNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono">
                  {invoice.customerAccountNumber}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Record payment ───────────────────────────────────────── */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Allocated oldest bill first across this invoice. Each bill is
              settled for real — the orders are marked paid, not just this
              document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ar-inv-amount">Amount ({invoice.currency})</Label>
              <Input
                id="ar-inv-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Outstanding: {fmt(invoice.outstandingAmount)} {invoice.currency}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How was it paid?" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-inv-note">Note</Label>
              <Textarea
                id="ar-inv-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={doPay} disabled={isPending}>
              {isPending ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel ───────────────────────────────────────────────── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this invoice?</DialogTitle>
            <DialogDescription>
              The document is withdrawn and its share link stops working. The
              debt itself is untouched — the bills go back to being invoiceable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isPending}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={doCancel}
              disabled={isPending}
            >
              {isPending ? "Cancelling…" : "Cancel invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
