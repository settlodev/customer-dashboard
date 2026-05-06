"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Plus,
  ShoppingCart,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import StockVariantSelector from "../widgets/stock-variant-selector";
import SupplierSelector from "../widgets/supplier-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createRequisition } from "@/lib/actions/requisition-actions";
import { CreateRequisitionSchema } from "@/types/requisition/schema";
import { PRIORITY_OPTIONS } from "@/types/requisition/type";
import type { FormResponse } from "@/types/types";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof CreateRequisitionSchema>;

export default function RequisitionForm() {
  const router = useRouter();
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this purchase requisition</AlertTitle>
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
                <ClipboardList className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Requisition details</h3>
                <p className={styles.formCardHeadDesc}>
                  Once approved, this can be converted to LPO(s) grouped by
                  preferred supplier.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className={styles.fieldRow}>
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>Priority</FormLabel>
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
                  render={({ field }) => {
                    const selected = field.value ? new Date(field.value) : undefined;
                    return (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>Needed by</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                className={cn(
                                  "h-10 w-full justify-start text-left font-normal",
                                  !selected && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                {selected ? format(selected, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) =>
                                field.onChange(d ? d.toISOString().split("T")[0] : "")
                              }
                              disabled={(date) => date < today}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2 min-w-0">
                      <FormLabel className={styles.fieldLabel}>
                        Notes
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Justification, references."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Preferred supplier per line lets the approval auto-generate
                  one LPO per supplier.
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
                      estimatedUnitCost: undefined,
                      preferredSupplierId: "",
                      notes: "",
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
                            <FormItem className="w-full md:flex-[4] min-w-0">
                              <FormLabel className="text-xs">
                                Stock item <span className="text-red-500">*</span>
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
                            <FormItem className="w-full md:flex-[2] min-w-0">
                              <FormLabel className="text-xs">
                                Est. cost
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
                        <FormField
                          control={form.control}
                          name={`items.${index}.preferredSupplierId`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[3] min-w-0">
                              <FormLabel className="text-xs">
                                Preferred supplier
                              </FormLabel>
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
                      </div>

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
                <AlertDialogTitle>Discard this requisition?</AlertDialogTitle>
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
            Create requisition
          </Button>
        </div>
      </form>
    </Form>
  );
}
