"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowRight } from "lucide-react";
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
import { createStockTransfer } from "@/lib/actions/stock-transfer-actions";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";

export default function StockTransferForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof StockTransferSchema>>({
    resolver: zodResolver(StockTransferSchema),
    defaultValues: {
      destinationLocationType: "LOCATION",
      destinationLocationId: "",
      transferType: "SUPPLY",
      notes: "",
      items: [{ stockVariantId: "", quantity: 0 }],
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

  const submitData = (values: z.infer<typeof StockTransferSchema>) => {
    setResponse(undefined);
    startTransition(() => {
      createStockTransfer(values).then((data) => {
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
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium">Transfer Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destinationLocationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Type <span className="text-red-500">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="LOCATION">Location</SelectItem>
                        <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                        <SelectItem value="STORE">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Destination ID" {...field} disabled={isPending} />
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
                    <Textarea placeholder="Transfer notes" rows={2} {...field} value={field.value ?? ""} disabled={isPending} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Transfer Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ stockVariantId: "", quantity: 0 })} disabled={isPending}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.stockVariantId`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Stock Item <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <StockVariantSelector value={f.value} onChange={f.onChange} isDisabled={isPending} />
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
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton isPending={isPending} label="Create Transfer" />
        </div>
      </form>
    </Form>
  );
}
