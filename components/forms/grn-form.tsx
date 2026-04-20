"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Link2, Unlink } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import SupplierSelector from "../widgets/supplier-selector";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import StockVariantSelector from "../widgets/stock-variant-selector";
import type { VariantMeta } from "../widgets/stock-variant-selector";
import { LpoPickerDialog } from "../widgets/grn/lpo-picker";
import type { LpoWithSupplierName } from "../widgets/grn/lpo-picker";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createGrn } from "@/lib/actions/grn-actions";
import { CreateGrnSchema } from "@/types/grn/schema";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateGrnSchema>;

const now = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

interface ItemMeta {
  displayName?: string;
  serialTracked: boolean;
}

export default function GrnForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  // Per-row metadata keyed by react-hook-form field id so reorders don't leak.
  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [linkedLpo, setLinkedLpo] = useState<LpoWithSupplierName | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateGrnSchema),
    defaultValues: {
      supplierId: "",
      receivedBy: "",
      receivedDate: now(),
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

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation failed",
      description: "Please review the highlighted fields.",
    });
  }, [toast]);

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
    (fieldId: string, meta: VariantMeta | null) => {
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
          },
        };
      });
    },
    [],
  );

  const removeItem = useCallback(
    (index: number, fieldId: string) => {
      remove(index);
      setItemMeta((prev) => {
        const next = { ...prev };
        delete next[fieldId];
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
      // Default to the outstanding (unreceived) quantity per line so partial
      // receipts one-shot correctly. User can adjust either direction.
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
  }, [form]);

  const totalValue = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + Number(item.receivedQuantity || 0) * Number(item.unitCost || 0),
        0,
      ),
    [watchedItems],
  );

  const filledItemCount = useMemo(
    () =>
      watchedItems.filter(
        (item) => item.stockVariantId && Number(item.receivedQuantity) > 0,
      ).length,
    [watchedItems],
  );

  const submitData = (values: FormValues) => {
    // Hard-stop: serial-tracked rows need a matching serial count.
    // We can't bake this into the Zod schema because `serialTracked` is
    // variant metadata fetched async, not part of the form payload.
    for (let i = 0; i < values.items.length; i++) {
      const item = values.items[i];
      const fieldId = fields[i]?.id;
      const tracked = fieldId ? itemMeta[fieldId]?.serialTracked : false;
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
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">GRN Details</h3>
                <p className="text-xs text-muted-foreground">
                  Tie the receipt to a supplier, and optionally to an open LPO so
                  we can update that order and track performance.
                </p>
              </div>
              {linkedLpo ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Link2 className="h-3 w-3" />
                    Linked LPO: {linkedLpo.lpoNumber}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={unlinkLpo}
                    disabled={isPending}
                  >
                    <Unlink className="h-4 w-4 mr-1" /> Unlink
                  </Button>
                </div>
              ) : (
                <LpoPickerDialog onPick={applyLpo} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        isDisabled={isPending || !!linkedLpo}
                      />
                    </FormControl>
                    {linkedLpo && (
                      <p className="text-[11px] text-muted-foreground">
                        Locked to the linked LPO&apos;s supplier.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Received By <span className="text-red-500">*</span>
                    </FormLabel>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Received Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ?? ""}
                        max={now()}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional context — reference numbers, shipment condition…"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Delivery person ────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Delivery Person</h3>
              <p className="text-xs text-muted-foreground">
                Optional — useful for contact-tracing short deliveries or returns.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="deliveryPersonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
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
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
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
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
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
          </CardContent>
        </Card>

        {/* ── Items ──────────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Items</h3>
                <p className="text-xs text-muted-foreground">
                  One row per variant. Serial-tracked items require serials
                  matching the received quantity.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ stockVariantId: "", receivedQuantity: 0, unitCost: 0 })
                }
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

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
                        <FormItem className="w-full md:flex-[5] min-w-0">
                          <FormLabel className="text-xs">
                            Stock Item <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <StockVariantSelector
                              value={f.value}
                              onChange={(v) => handleVariantChange(field.id, index, v)}
                              onVariantMeta={(m) => handleVariantMeta(field.id, m)}
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
                        <FormItem className="w-full md:flex-[2] min-w-0">
                          <FormLabel className="text-xs">
                            Qty <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Unit Cost
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({locationCurrency})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNumber`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Batch Number</FormLabel>
                          <FormControl>
                            <Input
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
                        <FormItem>
                          <FormLabel className="text-xs">Supplier Ref</FormLabel>
                          <FormControl>
                            <Input
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
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...f}
                              value={f.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
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
                          <FormItem>
                            <FormLabel className="text-xs flex items-center gap-2">
                              Serial Numbers <span className="text-red-500">*</span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {count} / {Math.trunc(qty) || 0}
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Textarea
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
                                className="font-mono text-xs"
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
          </CardContent>
        </Card>

        {/* ── Summary ────────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Summary
              </span>
              <span className="font-medium">
                {filledItemCount} item{filledItemCount === 1 ? "" : "s"} ready to receive
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Total value
              </span>
              <span className="font-mono font-semibold">
                {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {locationCurrency}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create GRN" />
        </div>
      </form>
    </Form>
  );
}
