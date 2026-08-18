"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { recordExpenseCreditNote } from "@/lib/actions/expense-credit-note-actions";
import { ExpenseCreditNoteSchema } from "@/types/expense/schema";
import type { Expense } from "@/types/expense/type";
import { CREDIT_NOTE_REASON_LABELS } from "@/types/expense-credit-note/type";

interface Props {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}

type FormValues = z.infer<typeof ExpenseCreditNoteSchema>;

export default function ExpenseCreditNoteForm({
  expense,
  open,
  onOpenChange,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(ExpenseCreditNoteSchema),
    defaultValues: {
      amount: expense.balanceDue,
      reason: "SHORT_DELIVERY",
      offsetChartOfAccountId: "",
      creditNoteDate: today,
      reference: "",
      notes: "",
    },
  });

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = await recordExpenseCreditNote(expense.id, values);
      if (result.responseType === "success") {
        toast({ variant: "success", title: "Credit note recorded", description: result.message });
        form.reset();
        onOpenChange(false);
        onRecorded?.();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Raise credit note</SheetTitle>
          <SheetDescription>
            Against {expense.expenseNumber} — outstanding{" "}
            <span className="font-mono tabular-nums">
              {expense.balanceDue.toLocaleString()} {expense.currencyCode}
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CREDIT_NOTE_REASON_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="offsetChartOfAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post credit to (optional)</FormLabel>
                  <FormControl>
                    <ChartOfAccountSelector
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      isDisabled={isPending}
                      placeholder="Default: Purchase Returns & Allowances"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditNoteDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isPending} {...field} />
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
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} value={field.value ?? ""} />
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea disabled={isPending} {...field} value={field.value ?? ""} />
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
                Raise credit note
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
