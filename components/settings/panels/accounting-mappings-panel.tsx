"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SettingsSection } from "../shared/settings-section";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import ProductSelector from "@/components/widgets/product-selector";
import { searchProducts } from "@/lib/actions/product-actions";
import {
  listPaymentMethodMappings,
  listProductRevenueMappings,
  upsertPaymentMethodMapping,
  upsertProductRevenueMapping,
  deletePaymentMethodMapping,
  deleteProductRevenueMapping,
} from "@/lib/actions/accounting-mapping-actions";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import type {
  PaymentMethodAccountMapping,
  ProductRevenueMapping,
  AccountType,
} from "@/types/accounting-mapping/type";
import type { Product } from "@/types/product/type";
import type { PaymentMethod, PaymentMethodChild } from "@/types/payments/type";

interface Props {
  locationId: string;
}

export function AccountingMappingsPanel({ locationId }: Props) {
  return (
    <div className="space-y-6">
      <PaymentMethodMappings locationId={locationId} />
      <ProductRevenueMappings locationId={locationId} />
    </div>
  );
}

// ── Payment method → account ───────────────────────────────────────

function PaymentMethodMappings({ locationId }: { locationId: string }) {
  const [mappings, setMappings] = useState<PaymentMethodAccountMapping[]>([]);
  const [methods, setMethods] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const [m, pms] = await Promise.all([
      listPaymentMethodMappings(locationId),
      fetchLocationPaymentMethods().catch(() => [] as PaymentMethod[]),
    ]);
    setMappings(m);
    setMethods(flattenPaymentMethods(pms));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  return (
    <SettingsSection
      title="Payment method accounts"
      description="Each POS payment posts a journal entry to the chart-of-account mapped here. Unmapped methods fall back to a suspense account."
    >
      <div className="flex justify-end">
        <MappingDialog
          locationId={locationId}
          methods={methods}
          mappings={mappings}
          onSaved={refresh}
        />
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : mappings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
            No payment method mappings yet.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/60">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Payment method</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Chart of account</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {mappings.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {methods.find((x) => x.id === m.paymentMethodId)?.name ?? m.paymentMethodCode}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.paymentMethodCode}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-muted-foreground">{m.chartOfAccountCode ?? "—"}</div>
                    <div className="text-sm">{m.chartOfAccountName ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{m.notes || "—"}</td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        const res = await deletePaymentMethodMapping(m.id);
                        if (res.responseType === "error") {
                          toast({
                            variant: "destructive",
                            title: "Couldn't deactivate",
                            description: res.message,
                          });
                          return;
                        }
                        toast({ title: "Deactivated", description: res.message });
                        refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSection>
  );
}

function MappingDialog({
  locationId,
  methods,
  mappings,
  onSaved,
}: {
  locationId: string;
  methods: { id: string; code: string; name: string }[];
  mappings: PaymentMethodAccountMapping[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Methods already mapped shouldn't appear again by default; editing flows
  // through the existing row ideally, so hide them in the picker.
  const mappedIds = new Set(mappings.filter((m) => m.active).map((m) => m.paymentMethodId));
  const available = methods.filter((m) => !mappedIds.has(m.id));

  const onSubmit = () => {
    const method = methods.find((m) => m.id === paymentMethodId);
    if (!method || !chartOfAccountId) {
      toast({
        variant: "destructive",
        title: "Pick a method and an account",
      });
      return;
    }
    startTransition(async () => {
      const res = await upsertPaymentMethodMapping({
        locationId,
        paymentMethodId: method.id,
        paymentMethodCode: method.code,
        chartOfAccountId,
        notes: notes.trim() || undefined,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
        return;
      }
      toast({ title: "Mapping saved" });
      setPaymentMethodId("");
      setChartOfAccountId("");
      setNotes("");
      setOpen(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map a payment method</DialogTitle>
          <DialogDescription>
            The mapped chart-of-account receives the debit leg of every journal
            entry for this payment method at this location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Payment method</label>
            <select
              className="w-full h-10 rounded-md border px-3 text-sm"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              disabled={isPending || available.length === 0}
            >
              <option value="">Select a payment method</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                All active payment methods already have a mapping.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Chart of account</label>
            <ChartOfAccountSelector
              accountType={"ASSET" as AccountType}
              value={chartOfAccountId}
              onChange={(val) => setChartOfAccountId(val)}
              placeholder="Typically an ASSET (cash/bank/till)"
              isDisabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Notes</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Product revenue → account ──────────────────────────────────────

function ProductRevenueMappings({ locationId }: { locationId: string }) {
  const [mappings, setMappings] = useState<ProductRevenueMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    setMappings(await listProductRevenueMappings(locationId));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  return (
    <SettingsSection
      title="Product revenue routing"
      description="Route specific products to their own revenue account for per-product P&L. Unmapped products land in the default Sales Revenue bucket."
    >
      <div className="flex justify-end">
        <ProductRevenueDialog locationId={locationId} onSaved={refresh} />
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : mappings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
            No product revenue mappings yet.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/60">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Revenue account</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {mappings.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium">{m.productName ?? m.productId.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-muted-foreground">{m.chartOfAccountCode ?? "—"}</div>
                    <div className="text-sm">{m.chartOfAccountName ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{m.notes || "—"}</td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        const res = await deleteProductRevenueMapping(m.id);
                        if (res.responseType === "error") {
                          toast({
                            variant: "destructive",
                            title: "Couldn't deactivate",
                            description: res.message,
                          });
                          return;
                        }
                        toast({ title: "Deactivated", description: res.message });
                        refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSection>
  );
}

function ProductRevenueDialog({
  locationId,
  onSaved,
}: {
  locationId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Lazy-load the product list the first time the dialog opens so the page
  // isn't paying for it up-front.
  useEffect(() => {
    if (!open || products.length > 0) return;
    let cancelled = false;
    searchProducts("", 1, 200)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.content ?? []);
      })
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [open, products.length]);

  const onSubmit = () => {
    if (!productId || !chartOfAccountId) {
      toast({
        variant: "destructive",
        title: "Pick a product and an account",
      });
      return;
    }
    startTransition(async () => {
      const res = await upsertProductRevenueMapping({
        locationId,
        productId,
        chartOfAccountId,
        notes: notes.trim() || undefined,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
        return;
      }
      toast({ title: "Mapping saved" });
      setProductId("");
      setChartOfAccountId("");
      setNotes("");
      setOpen(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map a product&apos;s revenue</DialogTitle>
          <DialogDescription>
            Revenue from this product will post to the chosen account instead
            of the default Sales Revenue bucket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Product</label>
            <ProductSelector
              value={productId}
              onChange={setProductId}
              onBlur={() => {}}
              isDisabled={isPending || products.length === 0}
              label=""
              placeholder={products.length === 0 ? "Loading products…" : "Select a product"}
              products={products}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Revenue account</label>
            <ChartOfAccountSelector
              accountType={"REVENUE" as AccountType}
              value={chartOfAccountId}
              onChange={(val) => setChartOfAccountId(val)}
              placeholder="Typically a REVENUE account"
              isDisabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function flattenPaymentMethods(methods: PaymentMethod[]): { id: string; code: string; name: string }[] {
  const out: { id: string; code: string; name: string }[] = [];
  for (const m of methods ?? []) {
    if (!m) continue;
    if (Array.isArray(m.children) && m.children.length > 0) {
      for (const c of m.children as PaymentMethodChild[]) {
        out.push({ id: c.id, code: c.code, name: c.displayName ?? c.code });
      }
    } else {
      out.push({ id: m.id, code: m.code, name: m.displayName ?? m.code });
    }
  }
  return out;
}
