"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import { Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import ZoneSelector from "@/components/widgets/zone-selector";
import {
  createStockTake,
  getStockTakePreview,
  updateStockTakeDraft,
  type StockTakePreview,
} from "@/lib/actions/stock-take-actions";
import { CreateStockTakeSchema } from "@/types/stock-take/schema";
import {
  ABC_CLASS_OPTIONS,
  CYCLE_COUNT_TYPE_DESCRIPTIONS,
  CYCLE_COUNT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
} from "@/types/stock-take/type";
import type { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateStockTakeSchema>;

interface Props {
  /** Pre-fill for edit flow. When present, form submits to updateStockTakeDraft. */
  initialValues?: Partial<FormValues>;
  /** Required when editing. Null/undefined means create. */
  stockTakeId?: string;
}

export default function StockTakeForm({ initialValues, stockTakeId }: Props) {
  const isEdit = Boolean(stockTakeId);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [preview, setPreview] = useState<StockTakePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { toast } = useToast();

  const defaults = useMemo<FormValues>(
    () => ({
      locationType: initialValues?.locationType ?? "LOCATION",
      cycleCountType: initialValues?.cycleCountType ?? "FULL",
      blindCount: initialValues?.blindCount ?? false,
      notes: initialValues?.notes ?? "",
      sampleMode: initialValues?.sampleMode ?? "size",
      abcClass: initialValues?.abcClass,
      zoneId: initialValues?.zoneId,
      sampleSize: initialValues?.sampleSize,
      samplePercentage: initialValues?.samplePercentage,
    }),
    [initialValues],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateStockTakeSchema),
    defaultValues: defaults,
  });

  const cycleType = form.watch("cycleCountType");
  const sampleMode = form.watch("sampleMode");
  const locationType = form.watch("locationType");

  useEffect(() => {
    if (cycleType !== "ABC_CLASS") form.setValue("abcClass", undefined);
    if (cycleType !== "ZONE") form.setValue("zoneId", undefined);
    if (cycleType !== "RANDOM") {
      form.setValue("sampleSize", undefined);
      form.setValue("samplePercentage", undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleType]);

  useEffect(() => {
    if (locationType !== "WAREHOUSE" && cycleType === "ZONE") {
      form.setValue("cycleCountType", "FULL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationType]);

  useEffect(() => {
    if (sampleMode === "size") form.setValue("samplePercentage", undefined);
    if (sampleMode === "percentage") form.setValue("sampleSize", undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleMode]);

  // Debounced scope preview — calls backend as the user configures the filter.
  // Skipped until the form has enough info to be meaningful (e.g., ABC class picked).
  const watched = form.watch();
  const previewKeyRef = useRef<string>("");
  useEffect(() => {
    const valid = CreateStockTakeSchema.safeParse(watched);
    if (!valid.success) {
      setPreview(null);
      return;
    }
    const key = JSON.stringify(valid.data);
    if (key === previewKeyRef.current) return;
    previewKeyRef.current = key;

    const handle = setTimeout(() => {
      setPreviewLoading(true);
      getStockTakePreview(valid.data)
        .then((result) => {
          if (previewKeyRef.current === key) setPreview(result);
        })
        .finally(() => {
          if (previewKeyRef.current === key) setPreviewLoading(false);
        });
    }, 750);
    return () => clearTimeout(handle);
  }, [watched]);

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
      const action = isEdit && stockTakeId
        ? updateStockTakeDraft(stockTakeId, values)
        : createStockTake(values);
      action.then((data) => {
        if (data) setResponse(data);
        if (data?.responseType === "error") {
          toast({
            variant: "destructive",
            title: isEdit ? "Couldn't update stock take" : "Couldn't create stock take",
            description: data.message,
          });
        }
      });
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-lg font-medium">
                {isEdit ? "Edit stock take" : "New stock take"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Items are populated from current inventory when you start the
                take. Blind count hides expected quantities from counters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where will the count run?</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATION_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleCountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Count type</FormLabel>
                    <Select
                      value={field.value ?? "FULL"}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CYCLE_COUNT_TYPE_OPTIONS
                          .filter((o) => o.value !== "ZONE" || locationType === "WAREHOUSE")
                          .map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {CYCLE_COUNT_TYPE_DESCRIPTIONS[field.value ?? "FULL"]}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {cycleType !== "FULL" && (
              <div className="rounded-md border bg-muted/30 p-4 space-y-4">
                {cycleType === "ABC_CLASS" && (
                  <FormField
                    control={form.control}
                    name="abcClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ABC class</FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ABC class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ABC_CLASS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                <div className="flex flex-col items-start">
                                  <span>{o.label}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {o.hint}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {cycleType === "ZONE" && (
                  <FormField
                    control={form.control}
                    name="zoneId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse zone</FormLabel>
                        <FormControl>
                          <ZoneSelector
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isDisabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {cycleType === "RANDOM" && (
                  <>
                    <FormField
                      control={form.control}
                      name="sampleMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample by</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value ?? "size"}
                              onValueChange={field.onChange}
                              disabled={isPending}
                              className="flex gap-6"
                            >
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="size" id="sampleModeSize" />
                                <span className="text-sm">Fixed count</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="percentage" id="sampleModePct" />
                                <span className="text-sm">Percentage</span>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {sampleMode === "size" && (
                      <FormField
                        control={form.control}
                        name="sampleSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of items to sample</FormLabel>
                            <FormControl>
                              <NumericFormat
                                customInput={Input}
                                thousandSeparator
                                allowNegative={false}
                                decimalScale={0}
                                placeholder="e.g. 25"
                                value={field.value ?? ""}
                                onValueChange={(v) =>
                                  field.onChange(v.floatValue ?? undefined)
                                }
                                onBlur={field.onBlur}
                                disabled={isPending}
                              />
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground">
                              Capped to the number of variants with stock at the location.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {sampleMode === "percentage" && (
                      <FormField
                        control={form.control}
                        name="samplePercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentage of inventory</FormLabel>
                            <FormControl>
                              <NumericFormat
                                customInput={Input}
                                allowNegative={false}
                                decimalScale={2}
                                suffix="%"
                                placeholder="e.g. 10"
                                value={field.value ?? ""}
                                onValueChange={(v) =>
                                  field.onChange(v.floatValue ?? undefined)
                                }
                                onBlur={field.onBlur}
                                disabled={isPending}
                              />
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground">
                              Rounded up to at least one item.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="blindCount"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-md bg-amber-50/50 border border-amber-100 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isPending}
                    className="h-4 w-4 accent-amber-600"
                    id="blindCount"
                  />
                  <label htmlFor="blindCount" className="text-sm font-medium cursor-pointer">
                    Blind count (counters can&apos;t see expected quantity)
                  </label>
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
                      placeholder="Optional — e.g. month-end count, incident trigger, auditor present…"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ScopePreview preview={preview} loading={previewLoading} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={isEdit ? "Save Changes" : "Create Stock Take"}
          />
        </div>
      </form>
    </Form>
  );
}

function ScopePreview({
  preview,
  loading,
}: {
  preview: StockTakePreview | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-sky-50/50 border border-sky-100 px-3 py-2 text-xs text-sky-900">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Computing scope…
      </div>
    );
  }
  if (!preview) return null;

  const empty = preview.matchCount === 0;
  return (
    <div
      className={
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs " +
        (empty
          ? "bg-red-50/50 border-red-100 text-red-800"
          : "bg-sky-50/50 border-sky-100 text-sky-900")
      }
    >
      <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>
        {empty ? (
          <span>Nothing matches this scope — start will be rejected.</span>
        ) : (
          <span>
            Will count <strong>{preview.matchCount}</strong> row
            {preview.matchCount === 1 ? "" : "s"}
            {preview.variantCount !== preview.matchCount && (
              <> across <strong>{preview.variantCount}</strong> variant
                {preview.variantCount === 1 ? "" : "s"}</>
            )}
            {preview.totalExpectedQuantity != null && (
              <> (expected qty {Number(preview.totalExpectedQuantity).toLocaleString()})</>
            )}
            .
          </span>
        )}
      </div>
    </div>
  );
}
