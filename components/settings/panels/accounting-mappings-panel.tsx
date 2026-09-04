"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  Loader2,
  Package,
  Plus,
  ShieldOff,
  StickyNote,
} from "lucide-react";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  ControlInput,
  ControlTextarea,
  RadioCards,
  StandaloneField as Field,
} from "@/components/ui/field";
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
import { ConfirmDeleteButton } from "../shared/confirm-delete-button";
import {
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
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
  SettlementTreatment,
} from "@/types/accounting-mapping/type";
import { ASSET_TYPES } from "@/types/accounting-mapping/type";
import type { Product } from "@/types/product/type";
import type { PaymentMethod, PaymentMethodChild } from "@/types/payments/type";

interface Props {
  locationId: string;
}

const ICON = "h-3.5 w-3.5";

/** Two options, each worth a sentence — hence cards rather than a select. */
const SETTLEMENT_OPTIONS: readonly {
  value: SettlementTreatment;
  label: string;
  description: string;
}[] = [
  {
    value: "IMMEDIATE",
    label: "Money received immediately",
    description: "Cash, bank, or till is debited as soon as the payment is taken.",
  },
  {
    value: "RECEIVABLE",
    label: "Provider owes us — settle later",
    description:
      "Posts to a holding / receivable account until the provider pays out.",
  },
];

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
  const [accessError, setAccessError] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const [m, pms] = await Promise.all([
      listPaymentMethodMappings(locationId),
      fetchLocationPaymentMethods().catch(() => [] as PaymentMethod[]),
    ]);
    if (m.forbidden) {
      setMappings([]);
      setAccessError(m.errorMessage ?? null);
    } else {
      setMappings(m.data);
      setAccessError(null);
    }
    setMethods(flattenPaymentMethods(pms));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  return (
    <SettingsSection
      icon={<CreditCard className="h-4 w-4" />}
      title="Payment method accounts"
      description="Each POS payment posts a journal entry to the chart-of-account mapped here. Unmapped methods fall back to a suspense account."
      footer={
        accessError ? undefined : (
          <MappingDialog
            locationId={locationId}
            methods={methods}
            mappings={mappings}
            onSaved={refresh}
          />
        )
      }
    >
      {!loading && accessError ? (
        <PermissionDeniedNotice message={accessError} />
      ) : (
        <SettingsTableCard
          loading={loading}
          isEmpty={mappings.length === 0}
          emptyLabel="No payment method mappings yet."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Payment method</th>
                <th className={thClass}>Chart of account</th>
                <th className={thClass}>Settlement</th>
                <th className={thClass}>Notes</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const methodName =
                  methods.find((x) => x.id === m.paymentMethodId)?.name ??
                  m.paymentMethodCode;
                return (
                  <tr key={m.id} className={trClass}>
                    <td className={tdClass}>
                      <div className="font-medium text-ink">{methodName}</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground">
                        {m.paymentMethodCode}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {m.chartOfAccountCode ?? "—"}
                      </div>
                      <div className="text-ink-2">{m.chartOfAccountName ?? "—"}</div>
                    </td>
                    <td className={tdClass}>
                      {m.settlementTreatment === "RECEIVABLE" ? (
                        <Badge variant="warn" className="font-normal">Receivable</Badge>
                      ) : (
                        <Badge variant="soft" className="font-normal">Immediate</Badge>
                      )}
                    </td>
                    <td className={`${tdClass} max-w-[200px] truncate text-ink-3`}>
                      {m.notes || "—"}
                    </td>
                    <td className={tdActionsClass}>
                      <ConfirmDeleteButton
                        confirmLabel="Deactivate"
                        title={`Deactivate the ${methodName} mapping?`}
                        description="New payments taken with this method post to the suspense account until it is mapped again. Journal entries already posted are unchanged."
                        onConfirm={async () => {
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
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SettingsTableCard>
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
  const [settlementTreatment, setSettlementTreatment] =
    useState<SettlementTreatment>("IMMEDIATE");
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
        settlementTreatment,
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
      setSettlementTreatment("IMMEDIATE");
      setNotes("");
      setOpen(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className={ICON} /> Add mapping
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

        <div className="space-y-3.5">
          <Field
            label="Payment method"
            required
            hint={
              available.length === 0
                ? "All active payment methods already have a mapping."
                : undefined
            }
          >
            {() => (
              <Combobox
                options={available.map((m) => ({
                  value: m.id,
                  label: m.name,
                  description: m.code,
                  keywords: [m.code],
                }))}
                value={paymentMethodId || null}
                onChange={(v) => setPaymentMethodId(v ?? "")}
                placeholder="Select a payment method"
                searchPlaceholder="Search payment methods…"
                emptyText="No payment methods found."
                disabled={isPending || available.length === 0}
                ariaLabel="Payment method"
              />
            )}
          </Field>

          <Field label="Settlement treatment" required>
            {() => (
              <RadioCards
                value={settlementTreatment}
                onChange={setSettlementTreatment}
                options={SETTLEMENT_OPTIONS}
                disabled={isPending}
                className="sm:grid-cols-1 lg:grid-cols-1"
              />
            )}
          </Field>

          <Field
            label="Chart of account"
            required
            hint={
              settlementTreatment === "RECEIVABLE"
                ? "Posts to a holding/receivable account until the provider pays out, instead of cash/bank received now."
                : undefined
            }
          >
            {() => (
              <ChartOfAccountSelector
                accountTypes={ASSET_TYPES}
                value={chartOfAccountId}
                onChange={(val) => setChartOfAccountId(val)}
                placeholder={
                  settlementTreatment === "RECEIVABLE"
                    ? "Provider holding / receivable account (e.g. 15xx / A/R)"
                    : "Typically an asset account (cash/bank/till)"
                }
                isDisabled={isPending}
              />
            )}
          </Field>

          <Field label="Notes" optional>
            {(id) => (
              <ControlTextarea
                id={id}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Settles to the main bank account T+2"
                disabled={isPending}
              />
            )}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !paymentMethodId || !chartOfAccountId}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Saving…" : "Save mapping"}
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
  const [accessError, setAccessError] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const result = await listProductRevenueMappings(locationId);
    if (result.forbidden) {
      setMappings([]);
      setAccessError(result.errorMessage ?? null);
    } else {
      setMappings(result.data);
      setAccessError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  return (
    <SettingsSection
      icon={<Package className="h-4 w-4" />}
      title="Product revenue routing"
      description="Route specific products to their own revenue account for per-product P&L. Unmapped products land in the default Sales Revenue bucket."
      footer={
        accessError ? undefined : (
          <ProductRevenueDialog locationId={locationId} onSaved={refresh} />
        )
      }
    >
      {!loading && accessError ? (
        <PermissionDeniedNotice message={accessError} />
      ) : (
        <SettingsTableCard
          loading={loading}
          isEmpty={mappings.length === 0}
          emptyLabel="No product revenue mappings yet."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Product</th>
                <th className={thClass}>Revenue account</th>
                <th className={thClass}>Notes</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const productLabel = m.productName ?? m.productId.slice(0, 8);
                return (
                  <tr key={m.id} className={trClass}>
                    <td className={`${tdClass} font-medium`}>{productLabel}</td>
                    <td className={tdClass}>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {m.chartOfAccountCode ?? "—"}
                      </div>
                      <div className="text-ink-2">{m.chartOfAccountName ?? "—"}</div>
                    </td>
                    <td className={`${tdClass} max-w-[200px] truncate text-ink-3`}>
                      {m.notes || "—"}
                    </td>
                    <td className={tdActionsClass}>
                      <ConfirmDeleteButton
                        confirmLabel="Deactivate"
                        title={`Stop routing ${productLabel} revenue?`}
                        description="Sales of this product go back to the default Sales Revenue account. Journal entries already posted are unchanged."
                        onConfirm={async () => {
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
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SettingsTableCard>
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
        <Button size="sm">
          <Plus className={ICON} /> Add mapping
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

        <div className="space-y-3.5">
          <Field label="Product" required>
            {() => (
              <ProductSelector
                value={productId}
                onChange={setProductId}
                onBlur={() => {}}
                isDisabled={isPending || products.length === 0}
                label=""
                placeholder={products.length === 0 ? "Loading products…" : "Select a product"}
                products={products}
              />
            )}
          </Field>

          <Field label="Revenue account" required>
            {() => (
              <ChartOfAccountSelector
                accountType={"REVENUE" as AccountType}
                value={chartOfAccountId}
                onChange={(val) => setChartOfAccountId(val)}
                placeholder="Typically a REVENUE account"
                isDisabled={isPending}
              />
            )}
          </Field>

          <Field label="Notes" optional>
            {(id) => (
              <ControlInput
                id={id}
                prefix={<StickyNote className={ICON} />}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Keeps catering revenue separate"
                disabled={isPending}
              />
            )}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !productId || !chartOfAccountId}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Saving…" : "Save mapping"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function PermissionDeniedNotice({ message }: { message?: string | null }) {
  return (
    <Alert tone="danger" variant="soft">
      <AlertIcon>
        <ShieldOff className="h-3.5 w-3.5" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Permission denied</AlertTitle>
        <AlertDescription>
          {message ||
            "You don't have permission to view these mappings. Contact your administrator if you think this is a mistake."}
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}

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
