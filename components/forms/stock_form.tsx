"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trash2,
  Plus,
  Package,
  Barcode as BarcodeIcon,
  Hash,
  Boxes,
  Archive,
  ArchiveRestore,
  Loader2,
  Wand2,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import {
  createStock,
  updateStock,
  archiveStockVariant,
  unarchiveStockVariant,
} from "@/lib/actions/stock-actions";
import { assignBarcode } from "@/lib/actions/barcode-actions";
import { getUnits, convertUnits } from "@/lib/actions/unit-actions";
import type { Stock } from "@/types/stock/type";
import type { UnitOfMeasure } from "@/types/unit/type";
import { StockSchema } from "@/types/stock/schema";
import type { FormResponse } from "@/types/types";
import UnitSelector from "@/components/widgets/unit-selector";
import { MATERIAL_TYPE_OPTIONS } from "@/types/catalogue/enums";

interface StockFormProps {
  item: Stock | null | undefined;
  balances?: Record<
    string,
    { quantityOnHand: number; averageCost: number | null }
  >;
}

const DEFAULT_VARIANT = {
  name: "",
  unitId: "",
  conversionToBase: 1,
  serialTracked: false,
  archived: false,
  initialQuantity: 0,
  initialUnitCost: 0,
};

export default function StockForm({ item, balances }: StockFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [archivingIndex, setArchivingIndex] = useState<number | null>(null);
  const [generatingBarcode, setGeneratingBarcode] = useState<number | null>(null);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const { toast } = useToast();

  const isEditing = !!item;
  const lastSyncedNameRef = useRef("");
  const lastSyncedUnitRef = useRef("");

  // Load units for conversion labels
  useEffect(() => {
    getUnits().then(setUnits);
  }, []);

  const unitMap = useMemo(
    () => new Map(units.map((u) => [u.id, u])),
    [units],
  );

  const form = useForm<z.infer<typeof StockSchema>>({
    resolver: zodResolver(StockSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      baseUnitId: item?.baseUnitId ?? "",
      materialType: item?.materialType ?? "FINISHED_GOOD",
      variants: item?.variants?.length
        ? item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? undefined,
            unitId: v.unitId,
            conversionToBase: v.conversionToBase,
            defaultCost: v.defaultCost ?? undefined,
            barcode: v.barcode ?? undefined,
            serialTracked: v.serialTracked,
            archived: v.archived,
            initialQuantity: 0,
            initialUnitCost: 0,
          }))
        : [DEFAULT_VARIANT],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const stockName = form.watch("name");
  const baseUnitId = form.watch("baseUnitId");
  const watchedVariants = form.watch("variants");

  // ── Auto-sync: stock name → first variant name
  useEffect(() => {
    if (isEditing || fields.length > 1) return;
    const current = form.getValues("variants.0.name");
    if (current === "" || current === lastSyncedNameRef.current) {
      form.setValue("variants.0.name", stockName || "");
      lastSyncedNameRef.current = stockName || "";
    }
  }, [stockName, isEditing, fields.length, form]);

  // ── Auto-sync: base unit → first variant unit
  useEffect(() => {
    if (isEditing || fields.length > 1) return;
    const current = form.getValues("variants.0.unitId");
    if (current === "" || current === lastSyncedUnitRef.current) {
      form.setValue("variants.0.unitId", baseUnitId || "");
      form.setValue("variants.0.conversionToBase", 1);
      lastSyncedUnitRef.current = baseUnitId || "";
    }
  }, [baseUnitId, isEditing, fields.length, form]);

  // ── Auto-fill conversion when variant unit changes
  const handleVariantUnitChange = async (
    index: number,
    newUnitId: string,
  ) => {
    form.setValue(`variants.${index}.unitId`, newUnitId);

    const currentBaseUnit = form.getValues("baseUnitId");
    if (!currentBaseUnit || !newUnitId) return;

    if (newUnitId === currentBaseUnit) {
      form.setValue(`variants.${index}.conversionToBase`, 1);
      return;
    }

    // Try to look up a known conversion
    const result = await convertUnits(newUnitId, currentBaseUnit, 1);
    if (result) {
      form.setValue(`variants.${index}.conversionToBase`, result.result);
    }
  };

  // ── Variant archive / unarchive
  const handleVariantArchive = async (
    index: number,
    shouldArchive: boolean,
  ) => {
    const variantId = form.getValues(`variants.${index}.id`);
    if (!variantId || !item) return;
    setArchivingIndex(index);
    try {
      if (shouldArchive) {
        await archiveStockVariant(item.id, variantId);
        form.setValue(`variants.${index}.archived`, true);
        toast({ title: "Archived", description: "Variant has been archived." });
      } else {
        await unarchiveStockVariant(item.id, variantId);
        form.setValue(`variants.${index}.archived`, false);
        toast({ title: "Restored", description: "Variant has been restored." });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${shouldArchive ? "archive" : "restore"} variant.`,
      });
    } finally {
      setArchivingIndex(null);
    }
  };

  // ── Barcode generation
  const handleGenerateBarcode = async (index: number) => {
    const variantId = form.getValues(`variants.${index}.id`);
    if (!variantId) return;
    setGeneratingBarcode(index);
    try {
      const updated = await assignBarcode(variantId);
      if (updated?.barcode) {
        form.setValue(`variants.${index}.barcode`, updated.barcode);
        toast({ title: "Barcode generated", description: updated.barcode });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate barcode." });
    } finally {
      setGeneratingBarcode(null);
    }
  };

  const onInvalid = useCallback(
    (_errors: FieldErrors) => {
      toast({ variant: "destructive", title: "Validation failed", description: "Please check your inputs." });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof StockSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      if (item) {
        const currentIds = new Set(values.variants.map((v) => v.id).filter(Boolean));
        const removed = (item.variants || []).map((v) => v.id).filter((vid) => !currentIds.has(vid));
        updateStock(item.id, values, removed).then((data) => { if (data) setResponse(data); });
      } else {
        createStock(values).then((data) => { if (data) setResponse(data); });
      }
    });
  };

  const handleAddVariant = () => {
    append({ ...DEFAULT_VARIANT, unitId: form.getValues("baseUnitId") || "" });
  };

  // ── Conversion label helper
  const getConversionLabel = (index: number) => {
    const variantUnitId = watchedVariants?.[index]?.unitId;
    const conversion = watchedVariants?.[index]?.conversionToBase;
    if (!variantUnitId || !baseUnitId || !conversion || conversion <= 0) return null;
    if (variantUnitId === baseUnitId) return null; // same unit, no label needed

    const vu = unitMap.get(variantUnitId);
    const bu = unitMap.get(baseUnitId);
    if (!vu || !bu) return null;

    const formatted =
      conversion >= 0.01
        ? conversion.toLocaleString(undefined, { maximumFractionDigits: 6 })
        : conversion.toExponential(4);

    return `1 ${vu.abbreviation} = ${formatted} ${bu.abbreviation}`;
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">

        {/* ── Stock Details ── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input className="pl-10" placeholder="e.g. Flour, Cooking Oil" {...field} disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="materialType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Material type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MATERIAL_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="baseUnitId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base unit <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <UnitSelector value={field.value} onChange={field.onChange} isDisabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description" rows={2} {...field} value={field.value ?? ""} disabled={isPending} />
                </FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Variants ── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-400" /> Variants
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">Different packaging sizes or units for this stock item</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariant} disabled={isPending}>
                <Plus className="w-4 h-4 mr-1" /> Add Variant
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const variantId = watchedVariants?.[index]?.id;
                const isArchived = !!watchedVariants?.[index]?.archived;
                const isExisting = !!variantId;
                const isDisabled = isPending || isArchived;
                const bal = variantId && balances ? balances[variantId] : null;
                const origVariant = item?.variants?.find((v) => v.id === variantId);
                const conversionLabel = getConversionLabel(index);

                return (
                  <div
                    key={field.id}
                    className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                      isArchived ? "bg-gray-100/80 dark:bg-gray-900/60 opacity-70" : "bg-gray-50/50 dark:bg-gray-900/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Variant {index + 1}</span>
                        {index === 0 && fields.length === 1 && !isEditing && (
                          <span className="text-xs font-normal text-muted-foreground">(default)</span>
                        )}
                        {origVariant?.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-medium">Default</span>
                        )}
                        {isArchived && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Archived</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isEditing && isExisting && (
                          <button type="button" onClick={() => handleVariantArchive(index, !isArchived)}
                            disabled={isPending || archivingIndex !== null}
                            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${isArchived ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"}`}>
                            {archivingIndex === index ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            <span>{isArchived ? "Unarchive" : "Archive"}</span>
                          </button>
                        )}
                        {fields.length > 1 && !isArchived && (
                          <button type="button" onClick={() => remove(index)} disabled={isPending}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Balance display (edit mode) */}
                    {isEditing && bal && (
                      <div className="flex gap-4 text-xs bg-blue-50/50 dark:bg-blue-950/20 rounded px-3 py-2">
                        <span className="text-muted-foreground">Qty: <strong className="text-foreground">{bal.quantityOnHand.toLocaleString()}</strong></span>
                        {bal.averageCost != null && bal.averageCost > 0 && (
                          <span className="text-muted-foreground">Avg Cost: <strong className="text-foreground">{bal.averageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                        )}
                      </div>
                    )}

                    {/* Core fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <FormField control={form.control} name={`variants.${index}.name`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="e.g. 50kg Bag, 1L Bottle" {...f} disabled={isDisabled} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`variants.${index}.unitId`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <UnitSelector
                              value={f.value}
                              onChange={(val) => handleVariantUnitChange(index, val)}
                              isDisabled={isDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`variants.${index}.conversionToBase`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Conversion to base <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <NumericFormat className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm" value={f.value} onValueChange={(v) => f.onChange(v.floatValue ?? 1)} placeholder="1" disabled={isDisabled} decimalScale={6} />
                          </FormControl>
                          {conversionLabel && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                              <ArrowRightLeft className="h-3 w-3" />
                              {conversionLabel}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Optional fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <FormField control={form.control} name={`variants.${index}.defaultCost`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Default cost</FormLabel>
                          <FormControl>
                            <NumericFormat className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm" value={f.value ?? ""} onValueChange={(v) => f.onChange(v.floatValue)} thousandSeparator placeholder="0" disabled={isDisabled} decimalScale={4} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`variants.${index}.sku`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">SKU</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10" placeholder="Optional" {...f} value={f.value ?? ""} disabled={isDisabled} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`variants.${index}.barcode`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Barcode</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <BarcodeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10 pr-10" placeholder="Optional" {...f} value={f.value ?? ""} disabled={isDisabled} />
                              {isEditing && isExisting && !f.value && (
                                <button type="button" onClick={() => handleGenerateBarcode(index)}
                                  disabled={isPending || generatingBarcode !== null}
                                  className="absolute right-2 top-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Generate barcode">
                                  {generatingBarcode === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>

                    {/* Serial tracking */}
                    <FormField control={form.control} name={`variants.${index}.serialTracked`} render={({ field: f }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Switch checked={f.value} onCheckedChange={f.onChange} disabled={isDisabled} /></FormControl>
                        <FormLabel className="text-xs cursor-pointer">Serial number tracking</FormLabel>
                      </FormItem>
                    )} />

                    {/* Opening Inventory (create only) */}
                    {!isEditing && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Boxes className="h-3.5 w-3.5" /> Opening inventory
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField control={form.control} name={`variants.${index}.initialQuantity`} render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Quantity</FormLabel>
                                <FormControl>
                                  <NumericFormat className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm" value={f.value} onValueChange={(v) => f.onChange(v.floatValue ?? 0)} thousandSeparator placeholder="0" disabled={isPending} decimalScale={6} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`variants.${index}.initialUnitCost`} render={({ field: f }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Unit cost</FormLabel>
                                <FormControl>
                                  <NumericFormat className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm" value={f.value} onValueChange={(v) => f.onChange(v.floatValue ?? 0)} thousandSeparator placeholder="0" disabled={isPending} decimalScale={4} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label={isEditing ? "Update Stock" : "Create Stock"} />
        </div>
      </form>
    </Form>
  );
}
