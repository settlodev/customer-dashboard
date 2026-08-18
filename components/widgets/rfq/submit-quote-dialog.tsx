"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Quote } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { SubmitQuoteSchema } from "@/types/rfq/schema";
import type { Rfq } from "@/types/rfq/type";
import { submitRfqQuote } from "@/lib/actions/rfq-actions";
import { useVatRegistrationStatus } from "@/hooks/use-vat-registration-status";
import { getCachedStocks, getCachedTaxTypes } from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";
import { formatMoney } from "@/lib/helpers";
import {
  computePurchaseTaxPreview,
  findBusinessDefaultTaxTypeId,
  resolveEffectiveTaxTypeId,
  resolveHeaderPricesIncludeTaxDefault,
} from "@/lib/purchase-tax";

type FormValues = z.infer<typeof SubmitQuoteSchema>;

interface Props {
  rfq: Rfq;
}

/**
 * Submit a supplier quote against an open RFQ. Buyers typically enter quotes
 * received by email/phone on behalf of the supplier.
 */
export function SubmitQuoteDialog({ rfq }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const vatRegistered = useVatRegistrationStatus();

  const rfqCurrency = rfq.targetCurrency || rfq.currency || "TZS";

  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [stockTaxTypeByVariant, setStockTaxTypeByVariant] = useState<
    Record<string, string | null>
  >({});
  const [
    stockPurchaseTaxInclusiveByVariant,
    setStockPurchaseTaxInclusiveByVariant,
  ] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    getCachedStocks()
      .then((stocks) => {
        const map: Record<string, string | null> = {};
        const inclusiveMap: Record<string, boolean> = {};
        (stocks ?? []).forEach((stock) => {
          (stock.variants ?? []).forEach((variant) => {
            map[variant.id] = stock.taxTypeId ?? null;
            inclusiveMap[variant.id] = stock.purchaseTaxInclusive ?? false;
          });
        });
        setStockTaxTypeByVariant(map);
        setStockPurchaseTaxInclusiveByVariant(inclusiveMap);
      })
      .catch(() => {
        setStockTaxTypeByVariant({});
        setStockPurchaseTaxInclusiveByVariant({});
      });
  }, []);

  const taxTypeMap = useMemo(
    () => new Map(taxTypes.map((t) => [t.id, t])),
    [taxTypes],
  );

  const businessDefaultTaxTypeId = useMemo(
    () => findBusinessDefaultTaxTypeId(taxTypes),
    [taxTypes],
  );

  const defaultItems = useMemo(
    () =>
      rfq.items.map((item) => ({
        rfqItemId: item.id,
        quotedUnitPrice: Number(item.targetUnitPrice ?? 0),
        quotedQuantity: Number(item.requestedQuantity ?? 0),
        currency: "",
        leadTimeDays: undefined,
        notes: "",
      })),
    [rfq.items],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(SubmitQuoteSchema),
    defaultValues: {
      supplierId: "",
      leadTimeDays: undefined,
      currency: "",
      paymentTerms: "",
      validityDate: "",
      notes: "",
      pricesIncludeTax: false,
      items: defaultItems,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const pricesIncludeTax = form.watch("pricesIncludeTax");

  // Deliberately NOT memoised on `watchedItems`. react-hook-form mutates its
  // value tree in place, so `watch("items")` returns the same array reference
  // every render (its internal spread is shallow). A useMemo keyed on it never
  // re-runs when a quantity or cost changes, so this footer sat frozen at the
  // values the rows held when some unrelated dependency last fired — in
  // practice 0.00, because nothing changes identity while you type. The
  // arithmetic is a few multiplications over a few rows; running it per
  // render costs nothing and cannot go stale.
  const totals = computePurchaseTaxPreview(
    watchedItems.map((item, i) => ({
      quantity: Number(item?.quotedQuantity || 0),
      cost: Number(item?.quotedUnitPrice || 0),
      taxTypeOverride: item?.taxTypeId,
      stockDefaultTaxTypeId:
        stockTaxTypeByVariant[rfq.items[i]?.stockVariantId ?? ""],
      stockPurchaseTaxInclusive:
        stockPurchaseTaxInclusiveByVariant[
          rfq.items[i]?.stockVariantId ?? ""
        ],
    })),
    { pricesIncludeTax, vatRegistered, businessDefaultTaxTypeId, taxTypes },
  );

  // Sum of the "Line total" column exactly as entered (qty × unit price), so
  // the table footer agrees with the rows above it. This is not
  // `totals.totalAmount` — that one is always gross, whereas the column is
  // net when the header toggle says prices exclude tax.
  const enteredLinesTotal = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum +
          Number(item?.quotedUnitPrice || 0) *
            Number(item?.quotedQuantity || 0),
        0,
      ),
    [watchedItems],
  );

  // Whether the operator has manually flipped the header toggle — once they
  // have, the auto-default effect below backs off and leaves their choice
  // alone. Reset whenever the dialog resets after a successful submit, so
  // reopening it for another supplier starts fresh.
  const pricesIncludeTaxTouchedRef = useRef(false);

  // What the header toggle should default to, given the RFQ's own items —
  // unlike the other four purchase forms this dialog's line set is fixed
  // (one row per rfq.items, no add/remove/variant-change), so this settles
  // once the catalogue fetch above resolves. See
  // resolveHeaderPricesIncludeTaxDefault (Fix 1, 2026-08 fix wave).
  const headerPricesIncludeTaxDefault = useMemo(
    () =>
      resolveHeaderPricesIncludeTaxDefault(
        rfq.items.map(
          (item) => stockPurchaseTaxInclusiveByVariant[item.stockVariantId],
        ),
      ),
    [rfq.items, stockPurchaseTaxInclusiveByVariant],
  );

  useEffect(() => {
    if (pricesIncludeTaxTouchedRef.current) return;
    form.setValue(
      "pricesIncludeTax",
      headerPricesIncludeTaxDefault.pricesIncludeTax,
      {
        shouldDirty: false,
      },
    );
  }, [headerPricesIncludeTaxDefault.pricesIncludeTax, form]);

  const onSubmit = (values: FormValues) => {
    startTransition(() => {
      submitRfqQuote(rfq.id, values).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't submit quote",
            description: res.message,
          });
          return;
        }
        toast({ title: "Quote submitted", description: res.message });
        form.reset({
          ...form.formState.defaultValues,
          items: defaultItems,
        } as FormValues);
        pricesIncludeTaxTouchedRef.current = false;
        setOpen(false);
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Quote className="h-4 w-4 mr-1.5" /> Submit quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Submit a supplier quote</DialogTitle>
          <DialogDescription>
            Record a supplier&apos;s response against this RFQ. One quote per
            supplier per RFQ.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Supplier <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <SupplierSelector
                        label="Supplier"
                        placeholder="Select supplier"
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={rfqCurrency}
                        maxLength={3}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Defaults to RFQ target ({rfqCurrency}).
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead time (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
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
                name="validityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid until</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment terms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 30% upfront, Net 30"
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
              name="pricesIncludeTax"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Quoted prices include tax</FormLabel>
                    <FormDescription>
                      Turn this on when the unit prices you&apos;re entering are
                      the tax-inclusive amounts from the supplier&apos;s quote.
                      Defaults from the items below — override if this quote
                      differs.
                    </FormDescription>
                    {headerPricesIncludeTaxDefault.mixed && (
                      <p className="text-[11px] text-amber-600">
                        The items below don&apos;t agree on whether prices
                        normally include tax — defaulted to off. Check each line
                        before saving.
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
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Item
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                      Qty quoted
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                      Unit price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Tax
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => {
                    const item = rfq.items[index];
                    const lineTotal =
                      Number(watchedItems[index]?.quotedUnitPrice || 0) *
                      Number(watchedItems[index]?.quotedQuantity || 0);
                    const itemDefaultTaxTypeId =
                      stockTaxTypeByVariant[item?.stockVariantId ?? ""] ?? null;
                    return (
                      <tr key={field.id}>
                        <td className="px-3 py-2 font-medium">
                          {item?.stockVariantDisplayName || "—"}
                          <div className="text-[10px] text-muted-foreground">
                            Requested:{" "}
                            {Number(
                              item?.requestedQuantity ?? 0,
                            ).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quotedQuantity`}
                            render={({ field: f }) => (
                              <FormItem>
                                <NumericFormat
                                  customInput={Input}
                                  value={f.value}
                                  onValueChange={(v) =>
                                    f.onChange(v.value ? Number(v.value) : 0)
                                  }
                                  thousandSeparator
                                  decimalScale={6}
                                  allowNegative={false}
                                  className="text-right"
                                  disabled={isPending}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quotedUnitPrice`}
                            render={({ field: f }) => (
                              <FormItem>
                                <NumericFormat
                                  customInput={Input}
                                  value={f.value}
                                  onValueChange={(v) =>
                                    f.onChange(v.value ? Number(v.value) : 0)
                                  }
                                  thousandSeparator
                                  decimalScale={4}
                                  allowNegative={false}
                                  className="text-right"
                                  disabled={isPending}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxTypeId`}
                            render={({ field: f }) => {
                              // Same 3-tier chain as the footer preview and
                              // the server's PurchaseTaxResolver: line
                              // override → stock item's default → business
                              // default (only when VAT-registered) → none.
                              const effectiveTaxTypeId =
                                resolveEffectiveTaxTypeId(
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
                                !isOverride &&
                                !itemDefaultTaxTypeId &&
                                !!effectiveTaxTypeId;
                              return (
                                <FormItem className="min-w-[170px]">
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
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {effectiveTaxType
                                      ? `${effectiveTaxType.ratePercent}%${
                                          isOverride
                                            ? ""
                                            : isItemDefault
                                              ? " (item default)"
                                              : isBusinessDefault
                                                ? " (business default)"
                                                : ""
                                        }`
                                      : "No tax configured"}
                                  </p>
                                </FormItem>
                              );
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {lineTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/60 font-semibold">
                    <td colSpan={4} className="px-3 py-2 text-right">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">
                      {enteredLinesTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-1 items-end text-sm pt-1">
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(totals.subtotal, rfqCurrency)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">
                  {vatRegistered
                    ? "Estimated tax"
                    : "Estimated tax (included in cost)"}
                </span>
                <span>{formatMoney(totals.taxAmount, rfqCurrency)}</span>
              </div>
              <div className="flex justify-between w-64 font-medium border-t pt-1">
                <span>Total</span>
                <span>{formatMoney(totals.totalAmount, rfqCurrency)}</span>
              </div>
              <p className="w-64 text-[11px] text-muted-foreground text-right">
                Shown so quotes can be compared on the same basis.
              </p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — delivery terms, exclusions, price breaks…"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit quote
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
