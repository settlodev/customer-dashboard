"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Receipt, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
import {
  AR_INVOICE_PAYMENT_LABELS,
  AR_INVOICE_PAYMENT_TONES,
  type CustomerArInvoiceSummary,
  type CustomerSignedBill,
} from "@/types/customer-ar-invoice/type";

interface Props {
  customerId: string;
  currency: string;
  /** The customer's unsettled signed bills — the invoiceable set. */
  signedBills: CustomerSignedBill[];
  invoices: CustomerArInvoiceSummary[];
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "—";

/**
 * The customer's open bills and the consolidated invoices raised over them.
 *
 * A bill can sit on only one open invoice, so anything already invoiced is
 * shown but not selectable — re-billing it would mean two documents each
 * claiming the same receivable.
 */
export function CustomerArInvoicesPanel({
  customerId,
  currency,
  signedBills,
  invoices,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Bills already claimed by a live invoice. The backend rejects a second
  // claim outright; greying them out here means the merchant sees why
  // instead of hitting the error.
  const invoicedOrderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const inv of invoices) {
      if (inv.status === "CANCELLED") continue;
      for (const id of inv.orderIds ?? []) ids.add(id);
    }
    return ids;
  }, [invoices]);

  const selectable = signedBills.filter((b) => !invoicedOrderIds.has(b.id));
  const allSelected =
    selectable.length > 0 && selected.size === selectable.length;

  const selectedTotal = signedBills
    .filter((b) => selected.has(b.id))
    .reduce((s, b) => s + Number(b.signedAmount ?? 0), 0);

  // "Invoice all" only ever covers what is actually claimable; the header
  // still reports the customer's full exposure so it ties to Total due.
  const outstandingTotal = selectable.reduce(
    (s, b) => s + Number(b.signedAmount ?? 0),
    0,
  );
  const allOutstanding = signedBills.reduce(
    (s, b) => s + Number(b.signedAmount ?? 0),
    0,
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectable.map((b) => b.id)));
  };

  const submit = () => {
    startTransition(async () => {
      const result = await createCustomerArInvoice({
        customerId,
        // With nothing ticked this means "every bill still free to invoice".
        // Sent explicitly rather than relying on the backend's invoice-all
        // default, which would include bills another invoice already claims
        // and be rejected wholesale.
        orderIds:
          selected.size > 0
            ? Array.from(selected)
            : selectable.map((b) => b.id),
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      });

      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not issue invoice",
          description: result.message,
        });
        return;
      }

      toast({ title: "Invoice issued", description: result.message });
      setDialogOpen(false);
      setSelected(new Set());
      setDueDate("");
      setNotes("");
      if (result.data?.id) router.push(`/ar-invoices/${result.data.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Open bills ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Open orders
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Unsettled signed bills — {fmt(allOutstanding)} {currency} across{" "}
                {signedBills.length}{" "}
                {signedBills.length === 1 ? "order" : "orders"}
              </p>
            </div>
            {selectable.length > 0 && (
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                disabled={isPending}
              >
                <FileText className="mr-1.5 h-4 w-4" />
                {selected.size > 0
                  ? `Invoice ${selected.size} selected`
                  : "Invoice all"}
              </Button>
            )}
          </div>

          {signedBills.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-10 text-center">
              <Receipt className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No open orders. Credit sales signed to this customer show up
                here until they&apos;re settled.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    <th className="w-10 px-3 py-2">
                      <Checkbox
                        aria-label="Select all open orders"
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Order
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Order total
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {signedBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          aria-label={`Select order ${bill.orderNumber ?? bill.id}`}
                          checked={selected.has(bill.id)}
                          disabled={invoicedOrderIds.has(bill.id)}
                          onCheckedChange={() => toggle(bill.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/orders/${bill.id}`}
                          className="font-mono text-[12px] text-ink hover:underline"
                        >
                          {bill.orderNumber ?? bill.id.slice(0, 8)}
                        </Link>
                        {invoicedOrderIds.has(bill.id) && (
                          <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                            Invoiced
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px] text-muted-foreground">
                        {fmtDate(bill.closedDate ?? bill.openedDate)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {fmt(Number(bill.netAmount ?? 0))}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium tabular-nums text-neg">
                        {fmt(Number(bill.signedAmount ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Invoices raised ────────────────────────────────────── */}
      {invoices.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Consolidated invoices
            </h3>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    <th className="px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Issued
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Bills
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Total
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Outstanding
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/ar-invoices/${inv.id}`}
                          className="font-mono text-[12px] font-medium text-ink hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px] text-muted-foreground">
                        {fmtDate(inv.issueDate)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {inv.orderCount}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {fmt(inv.totalAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium tabular-nums">
                        {fmt(inv.outstandingAmount)}
                      </td>
                      <td className="px-3 py-2">
                        {inv.status === "CANCELLED" ? (
                          <Badge variant="soft">Cancelled</Badge>
                        ) : (
                          <Badge
                            variant={
                              AR_INVOICE_PAYMENT_TONES[inv.paymentStatus]
                            }
                          >
                            {AR_INVOICE_PAYMENT_LABELS[inv.paymentStatus]}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Issue dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue consolidated invoice</DialogTitle>
            <DialogDescription>
              {selected.size > 0
                ? `${selected.size} ${selected.size === 1 ? "bill" : "bills"} · ${fmt(selectedTotal)} ${currency}`
                : `All ${selectable.length} uninvoiced ${selectable.length === 1 ? "bill" : "bills"} · ${fmt(outstandingTotal)} ${currency}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ar-invoice-due">Due date</Label>
              <Input
                id="ar-invoice-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-invoice-notes">Notes</Label>
              <Textarea
                id="ar-invoice-notes"
                placeholder="Payment terms, reference, anything the customer should see."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
              This bills for money already owed — it doesn&apos;t re-charge the
              customer. Paying it settles the underlying orders, and settling an
              order at the till clears it from here.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Issuing…" : "Issue invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
