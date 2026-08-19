"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Truck,
  PackagePlus,
  UserCheck,
  Link2,
  Unlink,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { NumericFormat } from "react-number-format";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
  controlInputClass,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import SupplierSelector from "../widgets/supplier-selector";

import styles from "./styles/form-shell.module.css";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import StockVariantSelector from "../widgets/stock-variant-selector";
import type { VariantMeta } from "../widgets/stock-variant-selector";
import CompatibleUnitSelector from "../widgets/compatible-unit-selector";
import { LpoPickerDialog } from "../widgets/grn/lpo-picker";
import type { LpoWithSupplierName } from "../widgets/grn/lpo-picker";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { useVatRegistrationStatus } from "@/hooks/use-vat-registration-status";
import { createGrn } from "@/lib/actions/grn-actions";
import { CreateGrnSchema } from "@/types/grn/schema";
import type { FormResponse } from "@/types/types";
import { getCachedTaxTypes } from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";
import { formatMoney } from "@/lib/helpers";
import {
  computePurchaseTaxPreview,
  findBusinessDefaultTaxTypeId,
  resolveEffectiveTaxTypeId,
  resolveHeaderPricesIncludeTaxDefault,
} from "@/lib/purchase-tax";

type FormValues = z.infer<typeof CreateGrnSchema>;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

interface ItemMeta {
  displayName?: string;
  serialTracked: boolean;
  /** Variant's tracking unit — anchors the purchase-pack picker. */
  unitId?: string;
  /** Name of that tracking unit, for "tracked in Egg Carton" copy. */
  unitName?: string;
  /**
   * The stock item's divisible sub-unit, when configured. Non-null means a
   * bare received quantity is ambiguous and GrnService's IntakeUnitGuard
   * rejects the receive — so the purchase unit becomes a required answer
   * on this line. See `VariantMeta.divisibleUnitId`.
   */
  divisibleUnitId?: string | null;
  divisibleUnitName?: string | null;
  /** The stock item's own default purchase tax type, if any — see `VariantMeta.stockTaxTypeId`. */
  stockTaxTypeId?: string | null;
  /** The stock item's own `purchaseTaxInclusive` default — see `VariantMeta.stockPurchaseTaxInclusive`. */
  stockPurchaseTaxInclusive?: boolean;
}

interface GrnFormProps {
  initialLpo?: LpoWithSupplierName | null;
}

export default function GrnForm({ initialLpo = null }: GrnFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();
  const vatRegistered = useVatRegistrationStatus();

  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [linkedLpo, setLinkedLpo] = useState<LpoWithSupplierName | null>(null);
  const [loadingItemRows, setLoadingItemRows] = useState<Set<string>>(
    () => new Set(),
  );
  const itemsLoading = loadingItemRows.size > 0;

  // Purchase tax types — same source, filter and sort as the stock item
  // form's picker (Task 1), so the per-line override behaves identically.
  useEffect(() => {
    getCachedTaxTypes()
      .then((tx) => {
        const activeTaxTypes = ((tx ?? []) as TaxType[])
          .filter((t) => t.active)
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
              a.code.localeCompare(b.code),
          );
        setTaxTypes(activeTaxTypes);
      })
      .catch(() => setTaxTypes([]));
  }, []);

  const handleItemLoadingChange = useCallback(
    (fieldId: string, loading: boolean) => {
      setLoadingItemRows((prev) => {
        const has = prev.has(fieldId);
        if (loading === has) return prev;
        const next = new Set(prev);
        if (loading) next.add(fieldId);
        else next.delete(fieldId);
        return next;
      });
    },
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateGrnSchema),
    defaultValues: {
      supplierId: "",
      pricesIncludeTax: false,
      receivedBy: "",
      receivedDate: new Date().toISOString(),
      notes: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      deliveryPersonEmail: "",
      lpoId: "",
      items: [{ stockVariantId: "", receivedQuantity: 0, unitCost: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const pricesIncludeTax = form.watch("pricesIncludeTax");

  const taxTypeMap = useMemo(
    () => new Map(taxTypes.map((t) => [t.id, t])),
    [taxTypes],
  );

  // The business's default tax type (isDefault, active) — the third tier of
  // the server's resolution chain, gated on VAT registration. See
  // PurchaseTaxResolver (Settlo Inventory Service): line override → stock
  // item → business default (registered only) → none.
  const businessDefaultTaxTypeId = useMemo(
    () => findBusinessDefaultTaxTypeId(taxTypes),
    [taxTypes],
  );

  // Live preview of net/tax/gross while the GRN is being composed — this
  // form is create-only and redirects straight to the detail page on
  // success (see createGrn), so there is never a saved GrnResponse to read
  // net/tax/gross off of before submit. See lib/purchase-tax.ts for why the
  // arithmetic mirrors the server exactly.
  // Deliberately NOT memoised on `watchedItems`. react-hook-form mutates its
  // value tree in place, so `watch("items")` returns the same array reference
  // every render (its internal spread is shallow). A useMemo keyed on it never
  // re-runs when a quantity or cost changes, so this footer sat frozen at the
  // values the rows held when some unrelated dependency last fired — in
  // practice 0.00, because nothing changes identity while you type. The
  // arithmetic is a few multiplications over a few rows; running it per
  // render costs nothing and cannot go stale.
  const totals = computePurchaseTaxPreview(
    (watchedItems ?? []).map((item, i) => {
      const fieldId = fields[i]?.id;
      const meta = fieldId ? itemMeta[fieldId] : undefined;
      return {
        quantity: Number(item?.receivedQuantity || 0),
        cost: Number(item?.unitCost || 0),
        taxTypeOverride: item?.taxTypeId,
        stockDefaultTaxTypeId: meta?.stockTaxTypeId,
        stockPurchaseTaxInclusive: meta?.stockPurchaseTaxInclusive,
      };
    }),
    { pricesIncludeTax, vatRegistered, businessDefaultTaxTypeId, taxTypes },
  );

  // Whether the operator has manually flipped the header toggle — once they
  // have, the auto-default effect below backs off and leaves their choice
  // alone. Not state: flipping it shouldn't re-render anything by itself.
  const pricesIncludeTaxTouchedRef = useRef(false);

  // What the header toggle should default to, given the stock items
  // currently on the document — see resolveHeaderPricesIncludeTaxDefault
  // (Fix 1, 2026-08 fix wave). Only lines with a resolved stock item count;
  // a blank row or one still awaiting its catalogue fetch is ignored.
  const headerPricesIncludeTaxDefault = useMemo(
    () =>
      resolveHeaderPricesIncludeTaxDefault(
        (watchedItems ?? []).map((item, i) => {
          if (!item?.stockVariantId) return undefined;
          const fieldId = fields[i]?.id;
          return fieldId ? itemMeta[fieldId]?.stockPurchaseTaxInclusive : undefined;
        }),
      ),
    [watchedItems, fields, itemMeta],
  );

  // Keep the header toggle in sync with the item defaults as lines are
  // added, removed, or their stock variant changes — so an untouched
  // toggle reflects what the server will actually derive (Fix 1). Backs off
  // once the operator has touched the switch themselves, and while an LPO
  // is linked (that case has its own, stronger forcing effect below).
  useEffect(() => {
    if (linkedLpo) return;
    if (pricesIncludeTaxTouchedRef.current) return;
    form.setValue("pricesIncludeTax", headerPricesIncludeTaxDefault.pricesIncludeTax, {
      shouldDirty: false,
    });
  }, [headerPricesIncludeTaxDefault.pricesIncludeTax, linkedLpo, form]);

  const handleVariantChange = useCallback(
    (fieldId: string, index: number, variantId: string) => {
      form.setValue(`items.${index}.stockVariantId`, variantId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!variantId) {
        setItemMeta((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }
    },
    [form],
  );

  const handleVariantMeta = useCallback(
    (fieldId: string, meta: VariantMeta | null, index?: number) => {
      // Serial-tracked stock is received one-by-one in its own tracking
      // unit and the picker below is disabled for it — but a pack-tracked
      // item still has to state a unit, so assert the tracking unit.
      if (meta?.divisibleUnitId && meta.serialTracked && meta.unitId && index !== undefined) {
        form.setValue(`items.${index}.purchaseUnitId`, meta.unitId, { shouldDirty: false });
      }
      setItemMeta((prev) => {
        if (!meta) {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        }
        return {
          ...prev,
          [fieldId]: {
            displayName: meta.displayName,
            serialTracked: meta.serialTracked,
            unitId: meta.unitId,
            unitName: meta.unitName,
            divisibleUnitId: meta.divisibleUnitId ?? null,
            divisibleUnitName: meta.divisibleUnitName ?? null,
            stockTaxTypeId: meta.stockTaxTypeId ?? null,
            stockPurchaseTaxInclusive: meta.stockPurchaseTaxInclusive,
          },
        };
      });
    },
    [form],
  );

  const removeItem = useCallback(
    (index: number, fieldId: string) => {
      remove(index);
      setItemMeta((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
      setLoadingItemRows((prev) => {
        if (!prev.has(fieldId)) return prev;
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    },
    [remove],
  );

  const applyLpo = useCallback(
    (lpo: LpoWithSupplierName) => {
      setLinkedLpo(lpo);
      form.setValue("lpoId", lpo.id, { shouldDirty: true });
      form.setValue("supplierId", lpo.supplierId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      const items = lpo.items.map((line) => {
        const outstanding = Math.max(
          0,
          Number(line.orderedQuantity || 0) - Number(line.receivedQuantity || 0),
        );
        return {
          stockVariantId: line.stockVariantId,
          receivedQuantity: outstanding,
          unitCost: Number(line.unitCost || 0),
        };
      });
      replace(items.length > 0 ? items : [{ stockVariantId: "", receivedQuantity: 0, unitCost: 0 }]);
      setItemMeta({});
      toast({
        title: "LPO linked",
        description: `Pre-filled ${items.length} item${items.length === 1 ? "" : "s"} from ${lpo.lpoNumber}.`,
      });
    },
    [form, replace, toast],
  );

  const unlinkLpo = useCallback(() => {
    setLinkedLpo(null);
    form.setValue("lpoId", "", { shouldDirty: true });
    // Set an immediate safe interim value directly — the LPO-forcing effect
    // below never runs on unlink (its guard is `if (!linkedLpo) return`), so
    // without this the field would keep whatever value was last forced
    // while linked. The header-default effect above then takes over on the
    // next render (its `linkedLpo` dependency just flipped to null) and
    // corrects this to whatever the now-unlinked lines' own stock items
    // imply — the LPO's items already carry their own tax metadata by this
    // point, so this is a brief interim, not the final value.
    form.setValue("pricesIncludeTax", false, { shouldDirty: false });
    // Also let the operator's next line change re-derive the default rather
    // than being stuck on a stale manual override from before the link.
    pricesIncludeTaxTouchedRef.current = false;
  }, [form]);

  // GrnService derives `pricesIncludeTax` from the linked LPO's own
  // recoverability (`!lpoRecoverable`, sampled off the LPO's stored line
  // tax) and overwrites whatever the client sends whenever the GRN carries
  // an lpoId — see the LPO-linked branch of GrnService (Settlo Inventory
  // Service). Unit costs prefilled from an LPO are already tax-normalised
  // one way or the other (net when recoverable, gross when not), so the
  // operator's own toggle would either tax an already-gross cost again or
  // strip tax from an already-net cost again. `vatRegistered` is the best
  // client-side stand-in for the LPO's own recoverability (both are the
  // same business-level VAT status; see the hook's own caveat about not yet
  // reading the resolved LPO). Force the field — and lock the control — so
  // neither the preview nor the operator can diverge from what the server
  // will actually apply.
  //
  // Guarded on `linkedLpo` being set, so this can never re-apply the old
  // forced value right after unlinkLpo's reset above: once `linkedLpo`
  // becomes null, this effect still re-runs (it's a dependency), but the
  // guard exits before touching the field.
  useEffect(() => {
    if (!linkedLpo) return;
    form.setValue("pricesIncludeTax", !vatRegistered, { shouldDirty: false });
  }, [linkedLpo, vatRegistered, form]);

  const initialLpoApplied = useRef(false);
  useEffect(() => {
    if (initialLpoApplied.current) return;
    if (!initialLpo) return;
    initialLpoApplied.current = true;
    applyLpo(initialLpo);
  }, [initialLpo, applyLpo]);

  const submitData = (values: FormValues) => {
    for (let i = 0; i < values.items.length; i++) {
      const item = values.items[i];
      const fieldId = fields[i]?.id;
      const meta = fieldId ? itemMeta[fieldId] : undefined;
      // Pack-tracked stock: IntakeUnitGuard refuses a bare quantity, since
      // "20" against an item tracked in cartons and also counted in pieces
      // could mean either. Caught here so the operator is pointed at the
      // Purchase unit field rather than at a failed receive.
      if (item.stockVariantId && meta?.divisibleUnitId && !item.purchaseUnitId) {
        form.setError(`items.${i}.purchaseUnitId`, {
          type: "manual",
          message: `Say which unit this quantity is in — ${meta.unitName ?? "the tracking unit"} or ${meta.divisibleUnitName ?? "the sub-unit"}.`,
        });
        toast({
          variant: "destructive",
          title: "Purchase unit required",
          description: `Item ${i + 1} is tracked in ${meta.unitName ?? "one unit"} and also counted in ${meta.divisibleUnitName ?? "another"} — choose the unit you received in.`,
        });
        return;
      }
      const tracked = meta?.serialTracked ?? false;
      if (!tracked) continue;
      const count = item.serialNumbers?.length ?? 0;
      const qty = Math.trunc(Number(item.receivedQuantity || 0));
      if (count !== qty || count === 0) {
        form.setError(`items.${i}.serialNumbers`, {
          type: "manual",
          message: `Serial-tracked items need exactly ${qty} serial number${qty === 1 ? "" : "s"}`,
        });
        toast({
          variant: "destructive",
          title: "Missing serial numbers",
          description: `Item ${i + 1} is serial-tracked — enter ${qty} serial${qty === 1 ? "" : "s"} before submitting.`,
        });
        return;
      }
    }

    setResponse(undefined);
    startTransition(() => {
      createGrn(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save GRN",
            description: data.message,
          });
        }
      });
    });
  };

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this goods received note</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submitData)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <Truck className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>GRN details</h3>
              <p className={styles.formCardHeadDesc}>
                Tie the receipt to a supplier, and optionally to an open LPO.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 01</span>
              {linkedLpo ? (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <Link2 className="h-3 w-3" />
                    {linkedLpo.lpoNumber}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={unlinkLpo}
                    disabled={isPending}
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1" /> Unlink
                  </Button>
                </>
              ) : (
                <LpoPickerDialog onPick={applyLpo} />
              )}
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Supplier</FieldLabel>
                    <FormControl>
                      <SupplierSelector
                        label="Supplier"
                        placeholder="Select supplier"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isDisabled={isPending || !!linkedLpo}
                      />
                    </FormControl>
                    {linkedLpo && (
                      <FieldHint>
                        Locked to the linked LPO&apos;s supplier.
                      </FieldHint>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Received by</FieldLabel>
                    <FormControl>
                      <StaffSelectorWidget
                        label="Received by"
                        placeholder="Select staff"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isDisabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  const today = startOfToday();
                  return (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Received date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                controlComboboxTriggerClass,
                                "justify-start",
                                !selected && "text-muted-2",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                              {selected ? format(selected, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(d) => field.onChange(d ? d.toISOString() : "")}
                            disabled={(date) => date > today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="pricesIncludeTax"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Supplier prices include tax</FormLabel>
                    <FormDescription>
                      {linkedLpo
                        ? "Set by the linked LPO — its unit costs are already tax-normalised, so this can't be changed here. Unlink the LPO to set it yourself."
                        : "Turn this on when the unit costs you are entering are the tax-inclusive amounts from the supplier's invoice. Defaults from the items below — override if this delivery differs."}
                    </FormDescription>
                    {!linkedLpo && headerPricesIncludeTaxDefault.mixed && (
                      <p className="text-[11px] text-amber-600">
                        The items below don&apos;t agree on whether prices normally include tax —
                        defaulted to off. Check each line before saving.
                      </p>
                    )}
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(v) => {
                        pricesIncludeTaxTouchedRef.current = true;
                        field.onChange(v);
                      }}
                      disabled={isPending || !!linkedLpo}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-[7px]">
                  <FieldLabel>Notes</FieldLabel>
                  <FormControl>
                    <ControlTextarea
                      placeholder="Optional context — reference numbers, shipment condition…"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>
                Delivery person
                <span className={styles.optionalTag}>OPTIONAL</span>
              </h3>
              <p className={styles.formCardHeadDesc}>
                Useful for contact-tracing short deliveries or returns.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 02</span>
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="deliveryPersonName"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Name</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="Driver or courier name"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryPersonPhone"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Phone</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="e.g. +255 712 345 678"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryPersonEmail"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Email</FieldLabel>
                    <FormControl>
                      <ControlInput
                        type="email"
                        placeholder="driver@example.com"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <PackagePlus className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Items</h3>
              <p className={styles.formCardHeadDesc}>
                One row per variant. Serial-tracked items require serials
                matching the received quantity.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 03</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ stockVariantId: "", receivedQuantity: 0, unitCost: 0 })
                }
                disabled={isPending}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add item
              </Button>
            </div>
          </header>
          <div className={styles.formBody}>

            {fields.map((field, index) => {
              const meta = itemMeta[field.id];
              const variantId = watchedItems[index]?.stockVariantId;
              const rowSerialTracked = meta?.serialTracked ?? false;
              const disabledVariantIds = watchedItems
                .map((i) => i.stockVariantId)
                .filter((id, i) => id && i !== index) as string[];

              return (
                <div
                  key={field.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Item {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index, field.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.stockVariantId`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[5] min-w-0 space-y-[7px]">
                          <FieldLabel required>Stock item</FieldLabel>
                          <FormControl>
                            <StockVariantSelector
                              value={f.value}
                              onChange={(v) => handleVariantChange(field.id, index, v)}
                              onVariantMeta={(m) => handleVariantMeta(field.id, m, index)}
                              onLoadingChange={(loading) =>
                                handleItemLoadingChange(field.id, loading)
                              }
                              isDisabled={isPending}
                              disabledValues={disabledVariantIds}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.receivedQuantity`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
                          <FieldLabel required>Quantity</FieldLabel>
                          <FormControl>
                            <ControlBox>
                              <NumericFormat
                                className={cn(controlInputClass, "tabular-nums")}
                                value={f.value}
                                onValueChange={(v) =>
                                  f.onChange(v.value ? Number(v.value) : 0)
                                }
                                thousandSeparator
                                decimalScale={rowSerialTracked ? 0 : 6}
                                allowNegative={false}
                                placeholder="0"
                                disabled={isPending}
                              />
                            </ControlBox>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                          <FieldLabel>
                            Unit cost
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({locationCurrency})
                            </span>
                          </FieldLabel>
                          <FormControl>
                            <ControlBox>
                              <NumericFormat
                                className={cn(controlInputClass, "tabular-nums")}
                                value={f.value}
                                onValueChange={(v) =>
                                  f.onChange(v.value ? Number(v.value) : 0)
                                }
                                thousandSeparator
                                decimalScale={4}
                                allowNegative={false}
                                placeholder="0.00"
                                disabled={isPending}
                              />
                            </ControlBox>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.taxTypeId`}
                      render={({ field: f }) => {
                        // Same 3-tier chain as the footer preview and the
                        // server's PurchaseTaxResolver: line override →
                        // stock item's default → business default (only
                        // when VAT-registered) → none.
                        const itemDefaultTaxTypeId = meta?.stockTaxTypeId ?? null;
                        const effectiveTaxTypeId = resolveEffectiveTaxTypeId(
                          f.value,
                          itemDefaultTaxTypeId,
                          vatRegistered,
                          businessDefaultTaxTypeId,
                        );
                        const effectiveTaxType = effectiveTaxTypeId
                          ? taxTypeMap.get(effectiveTaxTypeId)
                          : undefined;
                        const isOverride = !!f.value;
                        const isItemDefault =
                          !isOverride && !!itemDefaultTaxTypeId;
                        const isBusinessDefault =
                          !isOverride && !itemDefaultTaxTypeId && !!effectiveTaxTypeId;
                        return (
                          <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                            <FieldLabel optional>Tax</FieldLabel>
                            <FormControl>
                              <Combobox
                                options={taxTypes.map((t) => ({
                                  value: t.id,
                                  label: `${t.code} — ${t.name} (${t.ratePercent}%)`,
                                }))}
                                value={f.value ?? null}
                                onChange={(v) => f.onChange(v ?? null)}
                                placeholder={
                                  effectiveTaxTypeId
                                    ? "Use default"
                                    : taxTypes.length === 0
                                      ? "Loading tax types…"
                                      : "No tax"
                                }
                                searchPlaceholder="Search tax types…"
                                emptyText="No tax types found."
                                disabled={isPending}
                                ariaLabel="Tax"
                              />
                            </FormControl>
                            <FieldHint>
                              {effectiveTaxType
                                ? `${effectiveTaxType.name} ${effectiveTaxType.ratePercent}%${
                                    isOverride
                                      ? ""
                                      : isItemDefault
                                        ? " (item default)"
                                        : isBusinessDefault
                                          ? " (business default)"
                                          : ""
                                  }`
                                : "No tax configured"}
                            </FieldHint>
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.purchaseUnitId`}
                    render={({ field: f }) => {
                      const anchor = meta?.unitId;
                      const isSerial = !!meta?.serialTracked;
                      // Tracked in one unit and also counted in another: a
                      // bare number is ambiguous and the receive is refused,
                      // so the unit is a required answer, not a refinement.
                      const packTracked = !!meta?.divisibleUnitId;
                      const usingPack = !!f.value && f.value !== anchor;
                      return (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel
                            required={packTracked && !isSerial}
                            optional={!packTracked}
                          >
                            Purchase unit
                          </FieldLabel>
                          <FormControl>
                            <CompatibleUnitSelector
                              anchorUnitId={anchor}
                              value={f.value ?? ""}
                              onChange={(v) => {
                                f.onChange(v || undefined);
                                if (v) form.clearErrors(`items.${index}.purchaseUnitId`);
                              }}
                              isDisabled={isPending || !anchor || isSerial}
                              placeholder={
                                isSerial
                                  ? "Not available for serial-tracked items"
                                  : !anchor
                                    ? "Pick a stock item first"
                                    : packTracked
                                      ? `Choose ${meta?.unitName ?? "unit"} or ${meta?.divisibleUnitName ?? "sub-unit"}`
                                      : "Same as stock unit"
                              }
                            />
                          </FormControl>
                          <FieldHint>
                            {isSerial
                              ? "Serial-tracked items must be entered one-by-one in the variant's stock unit."
                              : packTracked && !f.value
                                ? `Tracked in ${meta?.unitName ?? "one unit"} and also counted in ${meta?.divisibleUnitName ?? "another"} — say which one the quantity above is in.`
                                : usingPack
                                  ? "Quantity & unit cost above are interpreted in this pack — converted to stock units on receive."
                                  : packTracked
                                    ? `Quantity & unit cost above are in ${meta?.unitName ?? "the tracking unit"}.`
                                    : "Leave blank to enter qty & cost directly in the variant's tracking unit."}
                          </FieldHint>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNumber`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel>Batch number</FieldLabel>
                          <FormControl>
                            <ControlInput
                              placeholder="Auto-generated if blank"
                              {...f}
                              value={f.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.supplierBatchReference`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel>Supplier ref</FieldLabel>
                          <FormControl>
                            <ControlInput
                              placeholder="Supplier batch reference"
                              {...f}
                              value={f.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.expiryDate`}
                      render={({ field: f }) => {
                        const selected = f.value ? new Date(f.value) : undefined;
                        return (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Expiry date</FieldLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isPending}
                                    className={cn(
                                      controlComboboxTriggerClass,
                                      "justify-start",
                                      !selected && "text-muted-2",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                    {selected ? format(selected, "PPP") : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={selected}
                                  onSelect={(d) => f.onChange(d ? d.toISOString().split("T")[0] : "")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  {rowSerialTracked && variantId && (
                    <Controller
                      control={form.control}
                      name={`items.${index}.serialNumbers`}
                      render={({ field: f, fieldState }) => {
                        const raw = (f.value ?? []).join("\n");
                        const qty = Number(watchedItems[index]?.receivedQuantity || 0);
                        const count = f.value?.length ?? 0;
                        const mismatch =
                          qty > 0 && count > 0 && count !== Math.trunc(qty);
                        return (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>
                              Serial numbers <span className="text-primary">*</span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {count} / {Math.trunc(qty) || 0}
                              </Badge>
                            </FieldLabel>
                            <FormControl>
                              <ControlTextarea
                                placeholder="One serial per line — must match received quantity exactly"
                                rows={Math.min(6, Math.max(3, Math.trunc(qty)))}
                                value={raw}
                                onChange={(e) => {
                                  const lines = e.target.value
                                    .split(/\r?\n/)
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);
                                  f.onChange(lines);
                                }}
                                disabled={isPending}
                              />
                            </FormControl>
                            {mismatch && (
                              <p className="text-[11px] text-red-600">
                                Count doesn&apos;t match quantity — add or remove serials.
                              </p>
                            )}
                            {fieldState.error && (
                              <FormMessage>{fieldState.error.message}</FormMessage>
                            )}
                          </FormItem>
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}

            <div className="flex flex-col gap-1 items-end text-sm mt-2 pt-3 border-t">
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(totals.subtotal, locationCurrency)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">
                  {vatRegistered ? "Tax" : "Tax (included in cost)"}
                </span>
                <span>{formatMoney(totals.taxAmount, locationCurrency)}</span>
              </div>
              <div className="flex justify-between w-64 font-medium border-t pt-1">
                <span>Total</span>
                <span>{formatMoney(totals.totalAmount, locationCurrency)}</span>
              </div>
              <p className="w-64 text-[11px] text-muted-foreground text-right">
                Estimated from the tax rates above — the server confirms the
                exact figures on save.
              </p>
            </div>
          </div>
        </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending || itemsLoading}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this GRN?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending || itemsLoading}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {itemsLoading ? "Loading items…" : "Create GRN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
