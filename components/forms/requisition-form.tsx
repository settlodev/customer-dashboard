"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import StockVariantSelector from "../widgets/stock-variant-selector";
import SupplierSelector from "../widgets/supplier-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createRequisition } from "@/lib/actions/requisition-actions";
import { CreateRequisitionSchema } from "@/types/requisition/schema";
import { PRIORITY_OPTIONS } from "@/types/requisition/type";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateRequisitionSchema>;

const today = () => new Date().toISOString().slice(0, 10);

export default function RequisitionForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateRequisitionSchema),
    defaultValues: {
      priority: "NORMAL",
      requiredByDate: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          requestedQuantity: 0,
          estimatedUnitCost: undefined,
          preferredSupplierId: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
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

  const totalEstimated = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + Number(item.requestedQuantity || 0) * Number(item.estimatedUnitCost || 0),
        0,
      ),
    [watchedItems],
  );

  const itemCount = useMemo(
    () =>
      watchedItems.filter(
        (item) => item.stockVariantId && Number(item.requestedQuantity) > 0,
      ).length,
    [watchedItems],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createRequisition(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save requisition",
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
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Requisition details</h3>
              <p className="text-xs text-muted-foreground">
                Request materials internally. Once approved, the requisition
                can be converted into LPO(s) grouped by preferred supplier.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value ?? "NORMAL"}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredByDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needed by</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={today()}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional — justification, references…"
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

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Items</h3>
                <p className="text-xs text-muted-foreground">
                  Preferred supplier per line lets the approval auto-generate
                  one LPO per supplier.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    stockVariantId: "",
                    requestedQuantity: 0,
                    estimatedUnitCost: undefined,
                    preferredSupplierId: "",
                    notes: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => {
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
                        onClick={() => remove(index)}
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
                              onChange={f.onChange}
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
                      name={`items.${index}.requestedQuantity`}
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
                              decimalScale={6}
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
                      name={`items.${index}.estimatedUnitCost`}
                      render={({ field: f }) => (
                        <FormItem className="w-full md:flex-[3] min-w-0">
                          <FormLabel className="text-xs">
                            Est. Cost
                            <span className="text-muted-foreground ml-1 font-normal">
                              ({locationCurrency})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              value={f.value ?? ""}
                              onValueChange={(v) =>
                                f.onChange(v.value === "" ? undefined : Number(v.value))
                              }
                              thousandSeparator
                              decimalScale={4}
                              allowNegative={false}
                              placeholder="0.00"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.preferredSupplierId`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Preferred supplier</FormLabel>
                          <FormControl>
                            <SupplierSelector
                              label="Preferred supplier"
                              placeholder="Optional — drives LPO grouping"
                              value={f.value ?? ""}
                              onChange={f.onChange}
                              onBlur={() => {}}
                              isDisabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Item notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional"
                              rows={2}
                              {...f}
                              value={f.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Summary
              </span>
              <span className="font-medium">
                {itemCount} item{itemCount === 1 ? "" : "s"} ready to request
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Est. total
              </span>
              <span className="font-mono font-semibold">
                {totalEstimated.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
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
          <SubmitButton isPending={isPending} label="Create Requisition" />
        </div>
      </form>
    </Form>
  );
}
