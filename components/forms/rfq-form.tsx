"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  FileBadge,
  PackagePlus,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NumericFormat } from "react-number-format";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlComboboxTriggerClass,
  controlInputClass,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import StockVariantSelector from "../widgets/stock-variant-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createRfq } from "@/lib/actions/rfq-actions";
import { useCachedSuppliers } from "@/lib/cache/reference-data";
import { CreateRfqSchema } from "@/types/rfq/schema";
import type { FormResponse } from "@/types/types";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof CreateRfqSchema>;

export default function RfqForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const { data: suppliersData } = useCachedSuppliers();
  const supplierOptions = useMemo(
    () => (suppliersData ?? []).map((s) => ({ label: s.name, value: s.id })),
    [suppliersData],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateRfqSchema),
    defaultValues: {
      title: "",
      targetCurrency: "",
      submissionDeadline: "",
      requiredByDate: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          requestedQuantity: 0,
          targetUnitPrice: undefined,
          specifications: "",
        },
      ],
      invitedSupplierIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const quoteCurrency = (form.watch("targetCurrency") || locationCurrency).toUpperCase();

  const submissionDeadlineValue = form.watch("submissionDeadline");
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const submissionDeadlineAsDate = useMemo(() => {
    if (!submissionDeadlineValue) return undefined;
    const d = new Date(submissionDeadlineValue);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [submissionDeadlineValue]);

  const onInvalid = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Validation failed",
      description: "Please review the highlighted fields.",
    });
  }, [toast]);

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    startTransition(() => {
      createRfq(values).then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save RFQ",
            description: data.message,
          });
        }
      });
    });
  };

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this RFQ</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FileBadge className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Request for quotation</h3>
                <p className={styles.formCardHeadDesc}>
                  Draft → Send → suppliers submit quotes → compare → award. The
                  awarded quote becomes an LPO.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Title</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="e.g. Q2 raw materials, December alcohol resupply"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-[15px] grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="targetCurrency"
                  render={({ field }) => {
                    const active = (field.value || locationCurrency).toUpperCase();
                    return (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Quote currency</FieldLabel>
                        <FormControl>
                          <CurrencySelector
                            value={active}
                            onChange={field.onChange}
                            isDisabled={isPending}
                          />
                        </FormControl>
                        <FieldHint>Defaults to {locationCurrency}.</FieldHint>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="submissionDeadline"
                  render={({ field }) => {
                    const selected = field.value ? new Date(field.value) : undefined;
                    return (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Submission deadline</FieldLabel>
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
                                  !selected && "text-muted-2",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
                                {selected ? format(selected, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) => {
                                if (!d) {
                                  field.onChange("");
                                  return;
                                }
                                const endOfDay = new Date(d);
                                endOfDay.setHours(23, 59, 59, 999);
                                field.onChange(endOfDay.toISOString());
                                const required = form.getValues("requiredByDate");
                                if (required) {
                                  const reqDate = new Date(required);
                                  if (reqDate < endOfDay) {
                                    form.setValue("requiredByDate", "", {
                                      shouldDirty: true,
                                    });
                                  }
                                }
                              }}
                              disabled={(date) => date < today}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FieldHint>After this, quotes are EXPIRED.</FieldHint>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="requiredByDate"
                  render={({ field }) => {
                    const selected = field.value ? new Date(field.value) : undefined;
                    return (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Needed by</FieldLabel>
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
                                  !selected && "text-muted-2",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-2" />
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
                                if (date < today) return true;
                                if (
                                  submissionDeadlineAsDate &&
                                  date < submissionDeadlineAsDate
                                )
                                  return true;
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="invitedSupplierIds"
                render={({ field }) => (
                  <FormItem className="mt-[15px] space-y-[7px]">
                    <FieldLabel optional>Invite suppliers</FieldLabel>
                    <FormControl>
                      <MultiSelect
                        options={supplierOptions}
                        defaultValue={field.value ?? []}
                        onValueChange={field.onChange}
                        placeholder={
                          supplierOptions.length > 0
                            ? "Select suppliers to invite"
                            : "Loading suppliers…"
                        }
                        maxCount={4}
                        disabled={isPending || supplierOptions.length === 0}
                      />
                    </FormControl>
                    <FieldHint>
                      Pre-seeds quote slots for each invited supplier.
                    </FieldHint>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-[15px] space-y-[7px]">
                    <FieldLabel optional>Notes</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        placeholder="Delivery terms, payment conditions, certifications required."
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <PackagePlus className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Target prices are anchors; suppliers still quote their own.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      stockVariantId: "",
                      requestedQuantity: 0,
                      targetUnitPrice: undefined,
                      specifications: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add item
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const disabledVariantIds = watchedItems
                    .map((i) => i.stockVariantId)
                    .filter((id, i) => id && i !== index) as string[];
                  return (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3 bg-muted/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
                            <FormItem className="w-full md:flex-[5] min-w-0 space-y-[7px]">
                              <FieldLabel required>Stock item</FieldLabel>
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
                            <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
                              <FieldLabel required>Qty</FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
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
                                </ControlBox>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.targetUnitPrice`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                              <FieldLabel>
                                Target price
                                <span className="text-muted-foreground ml-1 font-normal">
                                  ({quoteCurrency}, optional)
                                </span>
                              </FieldLabel>
                              <FormControl>
                                <ControlBox>
                                  <NumericFormat
                                    className={cn(controlInputClass, "tabular-nums")}
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
                                </ControlBox>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.specifications`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Specifications</FieldLabel>
                            <FormControl>
                              <ControlTextarea
                                placeholder="Grade, dimensions, certifications, brand restrictions."
                                {...f}
                                value={f.value ?? ""}
                                disabled={isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this RFQ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Create RFQ
          </Button>
        </div>
      </form>
    </Form>
  );
}
