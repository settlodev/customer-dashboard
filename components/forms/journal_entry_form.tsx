"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Receipt,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import {
  createJournalEntry,
  updateJournalEntry,
} from "@/lib/actions/journal-entry-actions";
import { JournalEntrySchema } from "@/types/journal-entry/schema";
import type { JournalEntry } from "@/types/journal-entry/type";

import styles from "./styles/form-shell.module.css";

interface Props {
  item: JournalEntry | null;
  defaultCurrency: string;
}

type FormValues = z.infer<typeof JournalEntrySchema>;

export default function JournalEntryForm({ item, defaultCurrency }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!item;
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(JournalEntrySchema),
    defaultValues: {
      description: item?.description ?? "",
      reference: item?.reference ?? "",
      entryDate: item?.entryDate ?? today,
      currencyCode: item?.currencyCode ?? defaultCurrency,
      exchangeRate: item?.exchangeRate ?? undefined,
      lines: item?.lines.length
        ? item.lines.map((l) => ({
            chartOfAccountId: l.chartOfAccountId,
            description: l.description ?? "",
            debitAmount: l.debitAmount ?? 0,
            creditAmount: l.creditAmount ?? 0,
          }))
        : [
            { chartOfAccountId: "", description: "", debitAmount: 0, creditAmount: 0 },
            { chartOfAccountId: "", description: "", debitAmount: 0, creditAmount: 0 },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const lines = form.watch("lines");
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debitAmount) || 0), 0);
  const totalCredit = lines.reduce(
    (s, l) => s + (Number(l.creditAmount) || 0),
    0,
  );
  const balanced = Math.abs(totalDebit - totalCredit) < 0.0001;

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateJournalEntry(item!.id, values)
        : await createJournalEntry(values);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        router.push("/accounting/journal-entries");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  const isLocked = isEdit && item!.status !== "DRAFT";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className={styles.formRoot}>
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Entry header</h3>
                <p className={styles.formCardHeadDesc}>
                  Manual journal entry — describe what it represents.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Description <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={2}
                          disabled={isPending || isLocked}
                          placeholder="Why is this journal entry being made?"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3 mt-3.5">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Entry date <span className="req">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending || isLocked}
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
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Currency
                      </FormLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onChange={field.onChange}
                          isDisabled={isPending || isLocked}
                          placeholder={`Default ${defaultCurrency}`}
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
                      <FormLabel className={styles.fieldLabel}>
                        Reference <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending || isLocked} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Lines</h3>
                <p className={styles.formCardHeadDesc}>
                  Total debits must equal total credits before posting.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending || isLocked}
                  onClick={() =>
                    append({
                      chartOfAccountId: "",
                      description: "",
                      debitAmount: 0,
                      creditAmount: 0,
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add line
                </Button>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-muted/40 p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.chartOfAccountId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Account
                              </FormLabel>
                              <FormControl>
                                <ChartOfAccountSelector
                                  value={field.value}
                                  onChange={(v) => field.onChange(v)}
                                  isDisabled={isPending || isLocked}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Memo
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isPending || isLocked}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.debitAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Debit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  {...field}
                                  value={field.value ?? ""}
                                  disabled={isPending || isLocked}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.creditAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={styles.fieldLabel}>
                                Credit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  {...field}
                                  value={field.value ?? ""}
                                  disabled={isPending || isLocked}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    {fields.length > 2 && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending || isLocked}
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove line
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-md border bg-card px-4 py-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total debit: </span>
                  <span className="font-mono tabular-nums font-medium">
                    {totalDebit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total credit: </span>
                  <span className="font-mono tabular-nums font-medium">
                    {totalCredit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="ml-auto">
                  {balanced ? (
                    <span className="font-medium text-green-600">
                      Balanced
                    </span>
                  ) : (
                    <span className="font-medium text-red-600">
                      Off by{" "}
                      {Math.abs(totalDebit - totalCredit).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <span className={styles.formFootSaveState}>
            {balanced
              ? "Saved as DRAFT — post from the entry detail page."
              : "Lines must balance before saving."}
          </span>
          <div className={styles.formFootSpacer} />
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => router.back()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
          </Button>
          <Button type="submit" disabled={isPending || isLocked || !balanced}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEdit ? "Save changes" : "Create entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
