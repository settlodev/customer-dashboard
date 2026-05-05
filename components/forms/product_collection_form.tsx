"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import {
  CheckCircle2,
  Coins,
  Globe2,
  Layers,
  PackagePlus,
  Plus,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { FormError } from "../widgets/form-error";
import { ProductCollection } from "@/types/product-collection/type";
import { ProductCollectionSchema } from "@/types/product-collection/schema";
import {
  createProductCollection,
  updateProductCollection,
} from "@/lib/actions/product-collection-actions";
import UploadImageWidget from "../widgets/UploadImageWidget";
import ProductVariantSelector from "../widgets/product-variant-selector";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import { Product, ProductVariant } from "@/types/product/type";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof ProductCollectionSchema>;

interface VariantLookup {
  variant: ProductVariant;
  product: Product;
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)}`;
  }
};

function ProductCollectionForm({ item }: { item: ProductCollection | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingVariantId, setPendingVariantId] = useState<string>("");
  const [pendingVariantQty, setPendingVariantQty] = useState<number>(1);
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  useEffect(() => {
    fetchAllProducts()
      .then(setProducts)
      .catch(() => {
        // Variant selector will surface the empty state if this fails.
      });
  }, []);

  // Map every variant to its parent product for label/price lookup. Used
  // both by the picker (filtering out already-added variants) and the
  // form preview (line totals + bundle default price).
  const variantLookup = useMemo<Map<string, VariantLookup>>(() => {
    const map = new Map<string, VariantLookup>();
    for (const product of products) {
      for (const variant of product.variants ?? []) {
        // Backend already filters deleted variants out of the list response;
        // archived variants stay so we can still surface them in edit mode.
        if (variant.archivedAt) continue;
        map.set(variant.id, { variant, product });
      }
    }
    return map;
  }, [products]);

  const form = useForm<FormValues>({
    resolver: zodResolver(ProductCollectionSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: imageUrl || item?.imageUrl || "",
      active: item?.active ?? true,
      nativeCurrency: item?.nativeCurrency ?? "TZS",
      // null tells the backend "use default sum"; unset on the form means
      // the merchant hasn't decided yet — both round-trip the same way.
      customPrice: item?.customPrice ?? null,
      items:
        item?.items?.map((line) => ({
          variantId: line.variantId,
          quantity: Number(line.quantity ?? 1),
        })) ?? [],
      currencyOverrides:
        item?.currencyOverrides?.map((override) => ({
          currency: override.currency,
          price: Number(override.price),
          active: override.active,
          notes: override.notes ?? undefined,
        })) ?? [],
    },
  });

  const itemsField = useFieldArray({ control: form.control, name: "items" });
  const overridesField = useFieldArray({
    control: form.control,
    name: "currencyOverrides",
  });

  const watchedItems = form.watch("items");
  const watchedNativeCurrency = (form.watch("nativeCurrency") || "TZS").toUpperCase();
  const watchedCustomPrice = form.watch("customPrice");

  // Live default-sum preview using the merchant's current item list.
  // Variants the picker hasn't loaded yet (slow API) fall back to the
  // server-side line total stored on the existing collection so the
  // preview never blanks out mid-edit.
  const fallbackTotalsByVariant = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of item?.items ?? []) {
      map.set(line.variantId, Number(line.lineTotal ?? 0));
    }
    return map;
  }, [item]);

  const livePreview = useMemo(() => {
    let total = 0;
    let mixedCurrency = false;
    for (const line of watchedItems ?? []) {
      const lookup = variantLookup.get(line.variantId);
      const qty = Number(line.quantity ?? 0);
      if (lookup) {
        total += Number(lookup.variant.price ?? 0) * qty;
        if (
          lookup.variant.nativeCurrency &&
          lookup.variant.nativeCurrency.toUpperCase() !== watchedNativeCurrency
        ) {
          // Mark a soft warning — backend stores the variant in its own
          // currency, but the bundle is denominated in nativeCurrency.
          mixedCurrency = true;
        }
      } else if (fallbackTotalsByVariant.has(line.variantId)) {
        total += fallbackTotalsByVariant.get(line.variantId)!;
      }
    }
    return { defaultPrice: total, mixedCurrency };
  }, [watchedItems, variantLookup, watchedNativeCurrency, fallbackTotalsByVariant]);

  const effectivePreview = watchedCustomPrice ?? livePreview.defaultPrice;
  const overrideDelta =
    watchedCustomPrice != null
      ? watchedCustomPrice - livePreview.defaultPrice
      : 0;

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const submitData = (values: FormValues) => {
    if (imageUrl) values.imageUrl = imageUrl;
    if (values.nativeCurrency) {
      values.nativeCurrency = values.nativeCurrency.toUpperCase();
    }
    values.currencyOverrides = (values.currencyOverrides ?? []).map((o) => ({
      ...o,
      currency: o.currency.toUpperCase(),
    }));

    startTransition(() => {
      const action = item
        ? updateProductCollection(item.id, values)
        : createProductCollection(values);
      action
        .then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/product-collections");
          }
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred.",
          });
        });
    });
  };

  // Variants already added are disabled in the picker so the merchant
  // can't add the same one twice (server enforces uniqueness too).
  const disabledVariantIds = (watchedItems ?? []).map((i) => i.variantId).filter(Boolean);

  const handleAddVariant = () => {
    if (!pendingVariantId) {
      toast({
        variant: "destructive",
        title: "Pick a variant",
        description: "Select a variant before adding it to the bundle.",
      });
      return;
    }
    if (disabledVariantIds.includes(pendingVariantId)) {
      toast({
        variant: "destructive",
        title: "Already in bundle",
        description: "That variant is already part of this bundle.",
      });
      return;
    }
    if (!Number.isFinite(pendingVariantQty) || pendingVariantQty <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Quantity must be greater than zero.",
      });
      return;
    }
    itemsField.append({ variantId: pendingVariantId, quantity: pendingVariantQty });
    setPendingVariantId("");
    setPendingVariantQty(1);
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className={styles.formRoot}>
        <div className={styles.formStack}>
          {/* ── Bundle details ───────────────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Bundle details</h3>
                <p className={styles.formCardHeadDesc}>
                  A set of variants sold together at one price.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 self-start">
                  <div className="w-[200px] h-[200px]">
                    <UploadImageWidget
                      imagePath="collections"
                      displayStyle="default"
                      displayImage={true}
                      showLabel={true}
                      label="Bundle image"
                      setImage={setImageUrl}
                      image={imageUrl}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Bundle name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Family Combo" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Description
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of what this bundle includes"
                            rows={3}
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                          <div className="space-y-0.5">
                            <FormLabel className={styles.fieldLabel}>Active</FormLabel>
                            <p className="text-[11px] text-muted-foreground">
                              Inactive bundles are hidden from the POS catalog.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Variants in the bundle ───────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <PackagePlus className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Bundle items</h3>
                <p className={styles.formCardHeadDesc}>
                  Pick the variants and how many of each ship in one bundle sale.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px_auto] gap-3 items-end rounded-md border bg-muted/30 p-3">
                <div>
                  <label className={`${styles.fieldLabel} text-xs`}>
                    Variant to add
                  </label>
                  <ProductVariantSelector
                    value={pendingVariantId}
                    onChange={setPendingVariantId}
                    placeholder="Search for a variant"
                    disabledValues={disabledVariantIds}
                    isDisabled={isPending}
                  />
                </div>
                <div>
                  <label className={`${styles.fieldLabel} text-xs`}>Quantity</label>
                  <NumericFormat
                    className="flex h-10 w-full rounded-md border-0 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={pendingVariantQty}
                    onValueChange={(v) =>
                      setPendingVariantQty(v.value ? Number(v.value) : 0)
                    }
                    placeholder="1"
                    decimalScale={6}
                    allowNegative={false}
                    disabled={isPending}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={isPending || !pendingVariantId}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add variant
                </Button>
              </div>

              <FormField
                control={form.control}
                // Surface root-level array errors (e.g. "must have at least one
                // variant") in the same place we render the empty state.
                name="items"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {itemsField.fields.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  No variants yet — add at least one for the bundle to be sellable.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Variant</th>
                        <th className="px-3 py-2 text-right font-medium">Unit price</th>
                        <th className="px-3 py-2 text-left font-medium w-[140px]">Quantity</th>
                        <th className="px-3 py-2 text-right font-medium">Line total</th>
                        <th className="px-3 py-2 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsField.fields.map((field, index) => {
                        const lineValue = watchedItems?.[index];
                        const lookup = variantLookup.get(lineValue?.variantId ?? field.variantId);
                        const fallback =
                          fallbackTotalsByVariant.get(lineValue?.variantId ?? field.variantId) ?? 0;
                        const unitPrice = lookup
                          ? Number(lookup.variant.price ?? 0)
                          : null;
                        const qty = Number(lineValue?.quantity ?? 0);
                        const lineTotal =
                          unitPrice != null ? unitPrice * qty : fallback;
                        const variantCcy = lookup?.variant.nativeCurrency?.toUpperCase();
                        const cur = variantCcy ?? watchedNativeCurrency;
                        const label = lookup
                          ? `${lookup.product.name} — ${lookup.variant.name}`
                          : item?.items?.find((i) => i.variantId === lineValue?.variantId)
                              ?.variantDisplayName ?? "Variant";
                        return (
                          <tr key={field.id} className="border-t">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-ink">{label}</span>
                                {variantCcy && variantCcy !== watchedNativeCurrency && (
                                  <Badge variant="soft" className="text-[10px]">
                                    {variantCcy}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {unitPrice != null ? formatMoney(unitPrice, cur) : "—"}
                            </td>
                            <td className="px-3 py-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity` as const}
                                render={({ field: qtyField }) => (
                                  <FormItem className="space-y-1">
                                    <FormControl>
                                      <NumericFormat
                                        className="flex h-9 w-full rounded-md border-0 bg-muted px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={qtyField.value ?? 1}
                                        onValueChange={(v) =>
                                          qtyField.onChange(v.value ? Number(v.value) : 0)
                                        }
                                        decimalScale={6}
                                        allowNegative={false}
                                        disabled={isPending}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[11px]" />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatMoney(lineTotal, cur)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => itemsField.remove(index)}
                                disabled={isPending}
                                title="Remove from bundle"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {livePreview.mixedCurrency && (
                <p className="text-[11px] text-amber-600">
                  Some variants are denominated in a different currency than the
                  bundle. The default-sum preview converts at 1:1; the bundle is
                  charged in {watchedNativeCurrency} at the till.
                </p>
              )}
            </div>
          </section>

          {/* ── Bundle pricing ───────────────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Coins className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Bundle pricing</h3>
                <p className={styles.formCardHeadDesc}>
                  Default is the sum of variant prices. Override to charge a
                  promo (lower) or premium (higher) bundle price.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 03</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nativeCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>Native currency</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TZS"
                          maxLength={3}
                          {...field}
                          value={(field.value ?? "TZS").toUpperCase()}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={styles.fieldLabel}>
                        Custom bundle price
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          // null/undefined renders as blank → backend default-sum.
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v.value === "" ? null : Number(v.value))
                          }
                          placeholder={`Default ${formatMoney(livePreview.defaultPrice, watchedNativeCurrency)}`}
                          thousandSeparator=","
                          decimalScale={2}
                          allowNegative={false}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Items</div>
                  <div className="font-medium tabular-nums">{itemsField.fields.length}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Default sum</div>
                  <div className="font-medium tabular-nums">
                    {formatMoney(livePreview.defaultPrice, watchedNativeCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Effective price</div>
                  <div className="font-medium tabular-nums">
                    {formatMoney(effectivePreview, watchedNativeCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Override</div>
                  <div
                    className={`font-medium tabular-nums ${
                      watchedCustomPrice == null
                        ? "text-muted-foreground"
                        : overrideDelta < 0
                          ? "text-emerald-600"
                          : overrideDelta > 0
                            ? "text-amber-600"
                            : "text-muted-foreground"
                    }`}
                  >
                    {watchedCustomPrice == null
                      ? "Default sum"
                      : overrideDelta === 0
                        ? "= sum"
                        : `${overrideDelta > 0 ? "+" : ""}${formatMoney(overrideDelta, watchedNativeCurrency)}`}
                  </div>
                </div>
              </div>

              {watchedCustomPrice != null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue("customPrice", null, { shouldDirty: true })}
                  disabled={isPending}
                >
                  Clear override (use default sum)
                </Button>
              )}
            </div>
          </section>

          {/* ── Per-currency price overrides ─────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Globe2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Currency overrides</h3>
                <p className={styles.formCardHeadDesc}>
                  Pin a specific bundle price for non-native currencies — the
                  till uses these at settlement instead of FX-converting the
                  native price.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 04</span>
              </div>
            </header>

            <div className={styles.formBody}>
              {overridesField.fields.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/20 px-4 py-4 text-center text-sm text-muted-foreground">
                  No currency overrides — bundle is FX-converted from {watchedNativeCurrency} at sale time.
                </p>
              ) : (
                <div className="space-y-3">
                  {overridesField.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-3 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`currencyOverrides.${index}.currency` as const}
                        render={({ field: ccyField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Currency</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="USD"
                                maxLength={3}
                                {...ccyField}
                                value={(ccyField.value ?? "").toUpperCase()}
                                onChange={(e) =>
                                  ccyField.onChange(e.target.value.toUpperCase())
                                }
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`currencyOverrides.${index}.price` as const}
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Price</FormLabel>
                            <FormControl>
                              <NumericFormat
                                className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={priceField.value ?? ""}
                                onValueChange={(v) =>
                                  priceField.onChange(v.value ? Number(v.value) : 0)
                                }
                                thousandSeparator=","
                                decimalScale={2}
                                allowNegative={false}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => overridesField.remove(index)}
                        disabled={isPending}
                        title="Remove override"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  overridesField.append({
                    currency: "",
                    price: 0,
                    active: true,
                  })
                }
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add currency override
              </Button>
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
                disabled={isPending}
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
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
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
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditing ? "Update bundle" : "Create bundle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ProductCollectionForm;
