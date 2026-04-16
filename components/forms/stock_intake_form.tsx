"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
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
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { createOpeningStock } from "@/lib/actions/opening-stock-actions";
import { OpeningStockSchema } from "@/types/opening-stock/schema";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";

export default function StockIntakeForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();

  // Track serial-tracked state per item index
  const [serialTrackedMap, setSerialTrackedMap] = useState<Record<number, boolean>>({});
  // Track serial number inputs per item index
  const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>({});

  const form = useForm<z.infer<typeof OpeningStockSchema>>({
    resolver: zodResolver(OpeningStockSchema),
    defaultValues: {
      notes: "",
      orderedDate: "",
      receivedDate: "",
      supplierId: "",
      items: [{ stockVariantId: "", quantity: 0, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({ variant: "destructive", title: "Validation failed", description: "Check your inputs." });
    },
    [toast],
  );

  const handleVariantMeta = useCallback((index: number, meta: VariantMeta | null) => {
    setSerialTrackedMap((prev) => ({ ...prev, [index]: meta?.serialTracked ?? false }));
    if (!meta?.serialTracked) {
      setSerialInputs((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }, []);

  const addSerialNumber = useCallback((index: number) => {
    setSerialInputs((prev) => ({
      ...prev,
      [index]: [...(prev[index] || []), ""],
    }));
  }, []);

  const updateSerialNumber = useCallback((itemIndex: number, snIndex: number, value: string) => {
    setSerialInputs((prev) => ({
      ...prev,
      [itemIndex]: (prev[itemIndex] || []).map((sn, i) => (i === snIndex ? value : sn)),
    }));
  }, []);

  const removeSerialNumber = useCallback((itemIndex: number, snIndex: number) => {
    setSerialInputs((prev) => ({
      ...prev,
      [itemIndex]: (prev[itemIndex] || []).filter((_, i) => i !== snIndex),
    }));
  }, []);

  const submitData = (values: z.infer<typeof OpeningStockSchema>) => {
    // Validate serial numbers for serial-tracked items
    for (let i = 0; i < values.items.length; i++) {
      if (serialTrackedMap[i]) {
        const serials = (serialInputs[i] || []).filter((s) => s.trim() !== "");
        const qty = values.items[i].quantity;
        if (serials.length !== qty) {
          toast({
            variant: "destructive",
            title: "Serial numbers required",
            description: `Item ${i + 1} requires exactly ${qty} serial number${qty !== 1 ? "s" : ""}, but ${serials.length} provided.`,
          });
          return;
        }
      }
    }

    // Attach serial numbers to items
    const payload = {
      ...values,
      supplierId: values.supplierId || undefined,
      orderedDate: values.orderedDate || undefined,
      receivedDate: values.receivedDate || undefined,
      items: values.items.map((item, i) => ({
        ...item,
        serialNumbers: serialTrackedMap[i]
          ? (serialInputs[i] || []).filter((s) => s.trim() !== "")
          : undefined,
      })),
    };

    setResponse(undefined);
    startTransition(() => {
      createOpeningStock(payload).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
        }
      });
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">

        {/* Header fields */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="orderedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date Ordered</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date Received</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-1">
                    <FormLabel className="text-xs">Supplier</FormLabel>
                    <FormControl>
                      <SupplierSelector
                        label="Supplier"
                        placeholder="Select supplier"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isDisabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-1">
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes" {...field} value={field.value ?? ""} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock items */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Stock Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ stockVariantId: "", quantity: 0, unitCost: 0 })}
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => {
                      remove(index);
                      setSerialTrackedMap((prev) => { const next = { ...prev }; delete next[index]; return next; });
                      setSerialInputs((prev) => { const next = { ...prev }; delete next[index]; return next; });
                    }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.stockVariantId`}
                    render={({ field: f }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Stock Item <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <StockVariantSelector
                            value={f.value}
                            onChange={f.onChange}
                            onVariantMeta={(meta) => handleVariantMeta(index, meta)}
                            isDisabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Quantity <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-10 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value}
                            onValueChange={(v) => f.onChange(v.value ? Number(v.value) : 0)}
                            thousandSeparator
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
                      <FormItem>
                        <FormLabel className="text-xs">Unit Cost <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-10 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value}
                            onValueChange={(v) => f.onChange(v.value ? Number(v.value) : 0)}
                            thousandSeparator
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional batch fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.batchNumber`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Batch Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...f} value={f.value ?? ""} disabled={isPending} />
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
                          <Input type="date" {...f} value={f.value ?? ""} disabled={isPending} />
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
                          <Input placeholder="Optional" {...f} value={f.value ?? ""} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Serial numbers (only for serial-tracked variants) */}
                {serialTrackedMap[index] && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">
                        Serial Numbers <span className="text-red-500">*</span>
                        <span className="text-gray-400 ml-1">
                          ({(serialInputs[index] || []).filter((s) => s.trim()).length} of {form.watch(`items.${index}.quantity`) || 0})
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSerialNumber(index)}
                        disabled={isPending}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Serial
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(serialInputs[index] || []).map((sn, snIdx) => (
                        <div key={snIdx} className="flex gap-1">
                          <Input
                            placeholder={`Serial #${snIdx + 1}`}
                            value={sn}
                            onChange={(e) => updateSerialNumber(index, snIdx, e.target.value)}
                            disabled={isPending}
                            className="h-8 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeSerialNumber(index, snIdx)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(serialInputs[index] || []).length === 0 && (
                      <p className="text-xs text-amber-600">This item requires serial number tracking. Add serial numbers matching the quantity.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Record Stock Intake" />
        </div>
      </form>
    </Form>
  );
}
