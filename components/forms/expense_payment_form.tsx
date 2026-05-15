"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/uploads/use-upload";
import { cn } from "@/lib/utils";

import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { ExpensePaymentMethodSelector } from "@/components/widgets/expense-payment-method-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { recordExpensePayment } from "@/lib/actions/expense-payment-actions";
import { fetchExchangeRate } from "@/lib/actions/exchange-rate-actions";
import { ExpensePaymentSchema } from "@/types/expense/schema";
import type { Expense } from "@/types/expense/type";

interface Props {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

type FormValues = z.infer<typeof ExpensePaymentSchema>;

export default function ExpensePaymentForm({
  expense,
  open,
  onOpenChange,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [paymentMethodLabel, setPaymentMethodLabel] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");
  const locationCurrency = useLocationCurrency() || expense.currencyCode || "TZS";

  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const manualFxRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(ExpensePaymentSchema),
    defaultValues: {
      amount: expense.balanceDue,
      currencyCode: expense.currencyCode,
      paymentDate: today,
      sourceAccountId: "",
      paymentMethodId: "",
      paymentMethod: "",
      reference: "",
      notes: "",
    },
  });

  // Same FX-resolution loop as the expense form: when payment currency
  // differs from the location's base, fetch the rate and pre-fill the
  // exchangeRate field. Operator can override.
  const watchedCurrency = form.watch("currencyCode");
  useEffect(() => {
    const code = (watchedCurrency || "").toUpperCase();
    if (!code || !locationCurrency) return;

    if (code === locationCurrency.toUpperCase()) {
      manualFxRef.current = false;
      form.setValue("exchangeRate", 1, { shouldDirty: false });
      setFxError(null);
      setFxLoading(false);
      return;
    }
    if (manualFxRef.current) return;

    let cancelled = false;
    setFxLoading(true);
    setFxError(null);
    fetchExchangeRate(code, locationCurrency)
      .then((rate) => {
        if (cancelled) return;
        if (!rate) {
          setFxError(
            `No rate for ${code} → ${locationCurrency}. Enter manually.`,
          );
          return;
        }
        form.setValue("exchangeRate", Number(rate.rate), {
          shouldDirty: false,
        });
      })
      .catch(() => {
        if (!cancelled) setFxError("Couldn't fetch rate. Enter manually.");
      })
      .finally(() => {
        if (!cancelled) setFxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchedCurrency, locationCurrency, form]);

  const watchedAmount = form.watch("amount");
  const watchedRate = form.watch("exchangeRate");
  const isForeignCurrency =
    !!watchedCurrency &&
    watchedCurrency.toUpperCase() !== locationCurrency.toUpperCase();
  const convertedAmount =
    isForeignCurrency && watchedRate && watchedAmount
      ? Number(watchedAmount) * Number(watchedRate)
      : null;

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = await recordExpensePayment(expense.id, {
        ...values,
        paymentMethod: paymentMethodLabel || values.paymentMethod,
      });
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Payment recorded",
          description: result.message,
        });
        form.reset();
        onOpenChange(false);
        onRecorded?.();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record payment</SheetTitle>
          <SheetDescription>
            For expense {expense.expenseNumber} — balance due{" "}
            <span className="font-mono tabular-nums">
              {expense.balanceDue.toLocaleString()} {expense.currencyCode}
            </span>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="mt-6 space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <CurrencySelector
                      value={field.value}
                      onChange={(code) => {
                        manualFxRef.current = false;
                        field.onChange(code);
                      }}
                      isDisabled={isPending}
                      placeholder={`Default ${locationCurrency}`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            {isForeignCurrency && (
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Rate to {locationCurrency}
                      {fxLoading && (
                        <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending || fxLoading}
                        onChange={(e) => {
                          manualFxRef.current = true;
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                      {fxError ? (
                        <span className="text-red-600">{fxError}</span>
                      ) : convertedAmount ? (
                        <>
                          {Number(watchedAmount).toLocaleString()} {watchedCurrency} ={" "}
                          <span className="font-medium">
                            {convertedAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}{" "}
                            {locationCurrency}
                          </span>
                        </>
                      ) : (
                        "Enter or override the rate"
                      )}
                    </p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          className={cn(
                            "h-10 w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4 opacity-50" />
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(d) => {
                          if (d) field.onChange(format(d, "yyyy-MM-dd"));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sourceAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay from</FormLabel>
                  <FormControl>
                    <ChartOfAccountSelector
                      accountType="ASSET"
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      isDisabled={isPending}
                      placeholder="Cash on hand, M-Pesa till, bank…"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <ExpensePaymentMethodSelector
                      value={field.value}
                      onChange={(id, label) => {
                        field.onChange(id);
                        setPaymentMethodLabel(label);
                      }}
                      isDisabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Receipt #, M-Pesa code…"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} disabled={isPending} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button type="button" variant="ghost" disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Record payment
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// Upload trigger — streams the file directly to R2 via presigned URL,
// then invokes onUploaded with metadata the caller registers against
// the expense.
export interface UploadAttachmentMetadata {
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface UploadFormProps {
  onUploaded: (metadata: UploadAttachmentMetadata) => Promise<void>;
  isPending: boolean;
}

export function UploadAttachmentTrigger({
  onUploaded,
  isPending,
}: UploadFormProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useUpload();
  const busy = isPending || isUploading;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
        {isUploading
          ? `Uploading ${progress?.percent ?? 0}%`
          : isPending
            ? "Saving…"
            : "Upload attachment"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const result = await upload({
              file,
              purpose: "EXPENSE_ATTACHMENT",
            });
            await onUploaded({
              url: result.url,
              key: result.key,
              filename: result.filename,
              contentType: result.contentType,
              size: result.size,
            });
          } finally {
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />
    </>
  );
}
