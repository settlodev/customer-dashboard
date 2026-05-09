"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
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
import { createFundTransfer } from "@/lib/actions/fund-transfer-actions";
import { FundTransferSchema } from "@/types/fund-transfer/schema";

import styles from "./styles/form-shell.module.css";

interface Props {
  locationId: string;
  defaultCurrency: string;
}

type FormValues = z.infer<typeof FundTransferSchema>;

export default function FundTransferForm({
  locationId,
  defaultCurrency,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(FundTransferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: undefined,
      currencyCode: defaultCurrency,
      transferDate: today,
      description: "",
      reference: "",
      notes: "",
    },
  });

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createFundTransfer(locationId, values);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Success",
          description: result.message,
        });
        router.push("/accounting/fund-transfers");
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
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Source &amp; destination</h3>
                <p className={styles.formCardHeadDesc}>
                  Both accounts must be ASSET type at this location.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        From <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <ChartOfAccountSelector
                          accountType="ASSET"
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          isDisabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        To <span className="req">*</span>
                      </FormLabel>
                      <FormControl>
                        <ChartOfAccountSelector
                          accountType="ASSET"
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          isDisabled={isPending}
                        />
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
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Amount &amp; date</h3>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Amount <span className="req">*</span>
                      </FormLabel>
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
                      <FormLabel className={styles.fieldLabel}>
                        Currency
                      </FormLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onChange={field.onChange}
                          isDisabled={isPending}
                          placeholder={`Default ${defaultCurrency}`}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transferDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Transfer date
                      </FormLabel>
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
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 mt-3.5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Description <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
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
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 mt-3.5">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Notes <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
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
            Record transfer
          </Button>
        </div>
      </form>
    </Form>
  );
}
