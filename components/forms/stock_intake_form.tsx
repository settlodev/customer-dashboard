"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { createStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import { StockIntakeRecordSchema } from "@/types/stock-intake-record/schema";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import type { VariantMeta } from "@/components/widgets/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { BusinessDayClosedDialog } from "@/components/widgets/business-day-closed-dialog";
import { useBusinessDayGuard } from "@/hooks/use-business-day-guard";

type StockIntakePayload = Parameters<typeof createStockIntakeRecord>[0];

export default function StockIntakeForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();
  const businessDayGuard = useBusinessDayGuard();

  // Track serial-tracked state per item index
  const [serialTrackedMap, setSerialTrackedMap] = useState<Record<number, boolean>>({});
  // Track serial number inputs per item index
  const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>({});

  const form = useForm<z.infer<typeof StockIntakeRecordSchema>>({
    resolver: zodResolver(StockIntakeRecordSchema),
    defaultValues: {
      notes: "",
      orderedDate: "",
      receivedDate: "",
      supplierId: "",
      supplierReference: "",
      items: [{ stockVariantId: "", quantity: 0, unitCost: 0, currency: locationCurrency }],
    },
  });

  // Back-fill any items that were added before the location currency resolved.
  useEffect(() => {
    const items = form.getValues("items") ?? [];
    items.forEach((item, index) => {
      if (!item?.currency) {
        form.setValue(`items.${index}.currency`, locationCurrency, { shouldDirty: false });
      }
    });
  }, [locationCurrency, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const orderedDateValue = form.watch("orderedDate");
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const orderedDateAsDate = useMemo(
    () => (orderedDateValue ? new Date(orderedDateValue) : undefined),
    [orderedDateValue],
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

  const submitData = (values: z.infer<typeof StockIntakeRecordSchema>) => {
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
      supplierReference: values.supplierReference?.trim() || undefined,
      items: values.items.map((item, i) => ({
        ...item,
        currency: item.currency ? item.currency.toUpperCase() : locationCurrency,
        serialNumbers: serialTrackedMap[i]
          ? (serialInputs[i] || []).filter((s) => s.trim() !== "")
          : undefined,
      })),
    };

    setResponse(undefined);
    submitPayload(payload as StockIntakePayload);
  };

  const submitPayload = (payload: StockIntakePayload) => {
    startTransition(() => {
      createStockIntakeRecord(payload).then((data) => {
        if (businessDayGuard.catch(data, () => submitPayload(payload))) return;
        if (data) setResponse(data);
        if (data?.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
        }
      });
    });
  };

  return (
    <>
      <BusinessDayClosedDialog
        open={businessDayGuard.dialogOpen}
        locationId={businessDayGuard.locationId}
        reason={businessDayGuard.reason}
        onDismiss={businessDayGuard.close}
        onDayOpened={businessDayGuard.onDayOpened}
      />
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData)} className="space-y-6">

        {/* Header fields */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="orderedDate"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  return (
                    <FormItem>
                      <FormLabel className="text-xs">Date ordered <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
                                !selected && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {selected ? format(selected, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(d) => {
                              field.onChange(d ? d.toISOString() : "");
                              const received = form.getValues("receivedDate");
                              if (d && received && new Date(received) < d) {
                                form.setValue("receivedDate", "", { shouldDirty: true });
                              }
                            }}
                            disabled={(date) => date > today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  return (
                    <FormItem>
                      <FormLabel className="text-xs">Date received <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
                                !selected && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {selected ? format(selected, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(d) => field.onChange(d ? d.toISOString() : "")}
                            disabled={(date) => {
                              if (date > today) return true;
                              if (orderedDateAsDate && date < orderedDateAsDate) return true;
                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
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
                name="supplierReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Full supplier reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DN / invoice #"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        maxLength={100}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes"
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

        {/* Stock items */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Stock items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ stockVariantId: "", quantity: 0, unitCost: 0, currency: locationCurrency })}
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add item
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.stockVariantId`}
                    render={({ field: f }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Stock item <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <StockVariantSelector
                            value={f.value}
                            onChange={f.onChange}
                            onVariantMeta={(meta) => handleVariantMeta(index, meta)}
                            isDisabled={isPending}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
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
                            className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={f.value}
                            onValueChange={(v) => f.onChange(v.value ? Number(v.value) : 0)}
                            thousandSeparator
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitCost`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Unit cost <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={f.value}
                            onValueChange={(v) => f.onChange(v.value ? Number(v.value) : 0)}
                            thousandSeparator
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.currency`}
                    render={({ field: f }) => {
                      const active = (f.value || locationCurrency).toUpperCase();
                      const isForeign = active !== locationCurrency.toUpperCase();
                      return (
                        <FormItem>
                          <FormLabel className="text-xs">Currency</FormLabel>
                          <FormControl>
                            <CurrencySelector
                              value={active}
                              onChange={f.onChange}
                              isDisabled={isPending}
                            />
                          </FormControl>
                          {isForeign ? (
                            <p className="text-[11px] text-amber-600">
                              Will convert to {locationCurrency} at confirm time.
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Location base currency.
                            </p>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Optional batch fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.batchNumber`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Batch number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...f} value={f.value ?? ""} disabled={isPending} />
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
                        <FormItem>
                          <FormLabel className="text-xs">Expiry date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isPending}
                                  className={cn(
                                    "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
                                    !selected && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
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
                  <FormField
                    control={form.control}
                    name={`items.${index}.supplierBatchReference`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Supplier ref</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...f} value={f.value ?? ""} disabled={isPending} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Serial numbers (only for serial-tracked variants) */}
                {serialTrackedMap[index] && (() => {
                  const qty = Math.floor(Number(form.watch(`items.${index}.quantity`)) || 0);
                  const serials = serialInputs[index] ?? [];
                  const count = serials.filter((s) => s.trim()).length;
                  const isValid = qty > 0 && count === qty;
                  return (
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">
                          Serial numbers <span className="text-red-500">*</span>
                          <span
                            className={`ml-2 text-[10px] font-normal ${isValid ? "text-green-600" : "text-amber-600"}`}
                          >
                            {count}/{qty} entered
                          </span>
                        </p>
                      </div>
                      <Textarea
                        placeholder={
                          qty > 0
                            ? `Enter ${qty} serial number${qty > 1 ? "s" : ""}, one per line`
                            : "Set quantity first"
                        }
                        rows={Math.min(Math.max(qty, 2) + 1, 8)}
                        value={serials.join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          setSerialInputs((prev) => ({ ...prev, [index]: lines }));
                        }}
                        disabled={isPending || qty === 0}
                        className="font-mono text-sm"
                      />
                      {qty > 0 && !isValid && count > 0 && (
                        <p className="text-[11px] text-amber-600">
                          {count < qty
                            ? `${qty - count} more serial number${qty - count > 1 ? "s" : ""} needed`
                            : `Too many — remove ${count - qty}`}
                        </p>
                      )}
                      {qty > 0 && count === 0 && (
                        <p className="text-[11px] text-amber-600">
                          This item requires serial number tracking. Enter one serial per line.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Record stock intake" />
        </div>
      </form>
    </Form>
    </>
  );
}
