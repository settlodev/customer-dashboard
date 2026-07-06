"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  PackageMinus,
  Plus,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlInputClass,
} from "@/components/ui/field";
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
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import SupplierSelector from "../widgets/supplier-selector";
import StockVariantSelector from "../widgets/stock-variant-selector";
import GrnSelector from "../widgets/grn/grn-selector";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { createSupplierReturn } from "@/lib/actions/supplier-return-actions";
import { CreateSupplierReturnSchema } from "@/types/supplier-return/schema";
import type { FormResponse } from "@/types/types";

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof CreateSupplierReturnSchema>;

export default function SupplierReturnForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const locationCurrency = useLocationCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateSupplierReturnSchema),
    defaultValues: {
      supplierId: "",
      grnId: "",
      reason: "",
      notes: "",
      items: [
        {
          stockVariantId: "",
          quantity: 0,
          unitCost: undefined,
          currency: "",
          reason: "",
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedSupplierId = form.watch("supplierId");
  const watchedGrnId = form.watch("grnId");
  const previousSupplierRef = useRef<string | undefined>(watchedSupplierId);
  const skipGrnClearRef = useRef(false);
  const [allowedStockVariantIds, setAllowedStockVariantIds] = useState<
    string[] | undefined
  >(undefined);
  const [maxQuantityByVariant, setMaxQuantityByVariant] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const prev = previousSupplierRef.current;
    if (skipGrnClearRef.current) {
      skipGrnClearRef.current = false;
    } else if (prev && prev !== watchedSupplierId && form.getValues("grnId")) {
      form.setValue("grnId", "", { shouldDirty: true, shouldValidate: false });
    }
    previousSupplierRef.current = watchedSupplierId;
  }, [watchedSupplierId, form]);

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
      createSupplierReturn(values).then((data) => {
        if (!data) return;
        if (data.responseType === "error") {
          setResponse(data);
          toast({
            variant: "destructive",
            title: "Couldn't save return",
            description: data.message,
          });
          return;
        }
        toast({
          title: "Return created",
          description: data.message,
        });
        const createdId = data.data?.id;
        router.push(
          createdId ? `/supplier-returns/${createdId}` : "/supplier-returns",
        );
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
            <AlertTitle>We couldn&apos;t save this supplier return</AlertTitle>
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
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Return to supplier</h3>
                <p className={styles.formCardHeadDesc}>
                  Created as Draft. Stock is only reduced when you dispatch.
                  Tie to a GRN if this is a refund against a specific receipt.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Supplier</FieldLabel>
                      <FormControl>
                        <SupplierSelector
                          label="Supplier"
                          placeholder="Select supplier"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          isDisabled={isPending || !!watchedGrnId}
                        />
                      </FormControl>
                      {watchedGrnId && (
                        <FieldHint>
                          Locked to the supplier on the linked GRN.
                        </FieldHint>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grnId"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Related GRN</FieldLabel>
                      <FormControl>
                        <GrnSelector
                          value={field.value ?? ""}
                          onChange={(v, grn) => {
                            if (grn) {
                              field.onChange(v);
                              if (
                                grn.supplierId !== form.getValues("supplierId")
                              ) {
                                skipGrnClearRef.current = true;
                                form.setValue("supplierId", grn.supplierId, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                              const mapped = (grn.items ?? []).map((item) => ({
                                stockVariantId: item.stockVariantId,
                                quantity: 0,
                                unitCost:
                                  item.originalUnitCost ?? item.unitCost ?? undefined,
                                currency: (
                                  item.originalCurrency ??
                                  item.currency ??
                                  ""
                                ).toUpperCase(),
                                reason: "",
                              }));
                              replace(
                                mapped.length > 0
                                  ? mapped
                                  : [
                                      {
                                        stockVariantId: "",
                                        quantity: 0,
                                        unitCost: undefined,
                                        currency: "",
                                        reason: "",
                                      },
                                    ],
                              );
                              setAllowedStockVariantIds(
                                Array.from(
                                  new Set(
                                    (grn.items ?? []).map(
                                      (item) => item.stockVariantId,
                                    ),
                                  ),
                                ),
                              );
                              const maxByVariant: Record<string, number> = {};
                              (grn.items ?? []).forEach((item) => {
                                maxByVariant[item.stockVariantId] =
                                  (maxByVariant[item.stockVariantId] ?? 0) +
                                  Number(item.receivedQuantity || 0);
                              });
                              setMaxQuantityByVariant(maxByVariant);
                            } else {
                              skipGrnClearRef.current = false;
                              form.reset();
                              setResponse(undefined);
                              setAllowedStockVariantIds(undefined);
                              setMaxQuantityByVariant({});
                            }
                          }}
                          onBlur={field.onBlur}
                          isDisabled={isPending}
                          supplierId={watchedSupplierId || undefined}
                          placeholder={
                            watchedSupplierId
                              ? "Select a GRN for this supplier"
                              : "Select a GRN"
                          }
                        />
                      </FormControl>
                      <FieldHint>
                        Drives supplier-performance tracking.
                      </FieldHint>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="mt-[15px] space-y-[7px]">
                    <FieldLabel required>Reason</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        placeholder="e.g. Damaged on arrival, wrong product, expired"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Credit note reference, supplier contact, photos."
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
                <PackageMinus className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  When linked to a GRN, qty is capped to received qty and unit
                  cost is locked to batch cost.
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
                      quantity: 0,
                      unitCost: undefined,
                      currency: "",
                      reason: "",
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
                  const lineCurrency = (
                    watchedItems[index]?.currency || locationCurrency
                  ).toUpperCase();
                  const rowVariantId = watchedItems[index]?.stockVariantId;
                  const rowMax = rowVariantId
                    ? maxQuantityByVariant[rowVariantId]
                    : undefined;
                  const unitCostLocked = !!watchedGrnId;
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
                                  allowedValues={allowedStockVariantIds}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[2] min-w-0 space-y-[7px]">
                              <FieldLabel>
                                Qty <span className="text-primary">*</span>
                                {rowMax !== undefined && (
                                  <span className="text-muted-foreground ml-1 font-normal">
                                    (max {rowMax})
                                  </span>
                                )}
                              </FieldLabel>
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
                                    isAllowed={(values) => {
                                      if (rowMax === undefined) return true;
                                      const { floatValue } = values;
                                      return (
                                        floatValue === undefined ||
                                        floatValue <= rowMax
                                      );
                                    }}
                                  />
                                </ControlBox>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitCost`}
                          render={({ field: f }) => (
                            <FormItem className="w-full md:flex-[3] min-w-0 space-y-[7px]">
                              <FieldLabel>
                                Unit cost
                                <span className="text-muted-foreground ml-1 font-normal">
                                  ({lineCurrency})
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
                                    placeholder="Defaults to batch cost"
                                    disabled={isPending || unitCostLocked}
                                  />
                                </ControlBox>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`items.${index}.reason`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Line reason</FieldLabel>
                            <FormControl>
                              <ControlInput
                                placeholder="Optional — specific reason for this line"
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
                <AlertDialogTitle>Discard this return?</AlertDialogTitle>
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
            Create return
          </Button>
        </div>
      </form>
    </Form>
  );
}
