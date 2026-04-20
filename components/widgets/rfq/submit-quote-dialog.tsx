"use client";

import { useMemo, useState, useTransition } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { SubmitQuoteSchema } from "@/types/rfq/schema";
import type { Rfq } from "@/types/rfq/type";
import { submitRfqQuote } from "@/lib/actions/rfq-actions";

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

  const rfqCurrency = rfq.targetCurrency || rfq.currency || "TZS";

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
      items: defaultItems,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const totalAmount = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + Number(item.quotedUnitPrice || 0) * Number(item.quotedQuantity || 0),
        0,
      ),
    [watchedItems],
  );

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
        form.reset({ ...form.formState.defaultValues, items: defaultItems } as FormValues);
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
      <DialogContent className="max-w-2xl">
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
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
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

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Qty quoted</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Unit price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => {
                    const item = rfq.items[index];
                    const lineTotal =
                      Number(watchedItems[index]?.quotedUnitPrice || 0) *
                      Number(watchedItems[index]?.quotedQuantity || 0);
                    return (
                      <tr key={field.id}>
                        <td className="px-3 py-2 font-medium">
                          {item?.stockVariantDisplayName || "—"}
                          <div className="text-[10px] text-muted-foreground">
                            Requested: {Number(item?.requestedQuantity ?? 0).toLocaleString()}
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
                  <tr className="bg-gray-50/60 font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                    <td className="px-3 py-2 text-right">
                      {totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
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
