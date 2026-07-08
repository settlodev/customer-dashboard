"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  Loader2,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { createProviderSettlement } from "@/lib/actions/provider-settlement-actions";
import { ProviderSettlementSchema } from "@/types/provider-settlement/schema";
import type { AccountType } from "@/types/accounting-mapping/type";

import styles from "./styles/form-shell.module.css";
import { NumericInput } from "@/components/ui/numeric-input";

interface Props {
  paymentMethodId: string;
  paymentMethodCode: string;
  locationId: string;
  defaultCurrency: string;
}

type FormValues = z.infer<typeof ProviderSettlementSchema>;

export default function ProviderSettlementForm({
  paymentMethodId,
  paymentMethodCode,
  locationId,
  defaultCurrency,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(ProviderSettlementSchema),
    defaultValues: {
      grossAmount: undefined,
      commissionAmount: undefined,
      bankAccountId: "",
      settlementDate: today,
      note: "",
    },
  });

  // Net-to-bank is a derived readout, not a form field — it recomputes on
  // every keystroke from the two amount fields so the operator always sees
  // what will actually land in the bank before they submit.
  const grossAmount = form.watch("grossAmount");
  const commissionAmount = form.watch("commissionAmount");
  const netAmount = Math.max(
    0,
    Number(grossAmount || 0) - Number(commissionAmount || 0),
  );

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createProviderSettlement(paymentMethodId, {
        ...values,
        locationId,
      });
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        router.push("/accounting/provider-settlements");
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className={styles.formRoot}>
        <div className={styles.formStack}>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-[13px] text-ink-2">
            <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Provider:{" "}
              <span className="font-semibold text-ink">
                {paymentMethodCode}
              </span>
            </span>
          </div>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <CircleDollarSign className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Payout amount</h3>
                <p className={styles.formCardHeadDesc}>
                  What the provider deposited, and any commission they kept.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="grossAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Gross amount</FieldLabel>
                      <FormControl>
                        <NumericInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="0.00"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Commission / fee</FieldLabel>
                      <FormControl>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0.00"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FieldHint>Deducted from the payout and expensed.</FieldHint>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-[7px]">
                  <label className="flex items-center gap-1.5 text-[13px] font-semibold leading-none text-ink">
                    Net to bank
                  </label>
                  <div className="flex h-9 w-full items-center justify-between rounded-md border border-line bg-card px-3 text-[13px] font-medium tabular-nums text-ink">
                    <span>
                      {netAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-mono text-[11px] font-normal text-muted-foreground">
                      {defaultCurrency}
                    </span>
                  </div>
                  <FieldHint>
                    Gross minus commission — what actually lands in the bank.
                  </FieldHint>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Settlement details</h3>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Bank account</FieldLabel>
                      <FormControl>
                        <ChartOfAccountSelector
                          accountType={"ASSET" as AccountType}
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          placeholder="Defaults to Bank - Primary"
                          isDisabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="settlementDate"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Settlement date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                controlComboboxTriggerClass,
                                "justify-start",
                                !field.value && "text-muted-2",
                              )}
                            >
                              <CalendarDays className="mr-2 h-4 w-4 text-muted-2" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-[15px] grid grid-cols-1 gap-x-[18px] gap-y-[15px]">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Note</FieldLabel>
                      <FormControl>
                        <ControlTextarea {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => router.back()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Record payout
          </Button>
        </div>
      </form>
    </Form>
  );
}
