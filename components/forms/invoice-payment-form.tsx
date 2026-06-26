"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Loader2, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { ExpensePaymentMethodSelector } from "@/components/widgets/expense-payment-method-selector";
import { NumericInput } from "@/components/ui/numeric-input";
import { recordInvoicePayment } from "@/lib/actions/invoicing-invoice-actions";
import {
  InvoicePaymentSchema,
  type InvoicePaymentFormValues,
} from "@/types/invoicing/schema";
import { invoiceBalanceDue, type Invoice } from "@/types/invoicing/type";

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

export default function InvoicePaymentForm({
  invoice,
  open,
  onOpenChange,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [methodId, setMethodId] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");
  const balanceDue = invoiceBalanceDue(invoice);

  const form = useForm<InvoicePaymentFormValues>({
    resolver: zodResolver(InvoicePaymentSchema),
    defaultValues: {
      amount: balanceDue,
      paymentMethodId: "",
      paymentMethodCode: "",
      sourceAccountId: "",
      paymentDate: today,
      reference: "",
      notes: "",
    },
  });

  const submit = (values: InvoicePaymentFormValues) => {
    startTransition(async () => {
      const result = await recordInvoicePayment(invoice.id, values);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Payment recorded",
          description: result.message,
        });
        form.reset();
        setMethodId("");
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
            For invoice {invoice.invoiceNumber} — balance due{" "}
            <span className="font-mono tabular-nums">
              {balanceDue.toLocaleString()} {invoice.currencyCode}
            </span>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({invoice.currencyCode})</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0.00"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethodCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <ExpensePaymentMethodSelector
                      value={methodId}
                      isDisabled={isPending}
                      onChange={(id, label, code) => {
                        setMethodId(id);
                        form.setValue("paymentMethodId", id, {
                          shouldValidate: false,
                        });
                        field.onChange(code || label);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sourceAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Deposit to{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional override)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <ChartOfAccountSelector
                      accountType="ASSET"
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v)}
                      isDisabled={isPending}
                      placeholder="Default from payment method"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
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
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={2}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button type="button" variant="ghost" disabled={isPending}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
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
