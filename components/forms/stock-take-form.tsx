"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import ZoneSelector from "@/components/widgets/zone-selector";
import DepartmentSelector from "@/components/widgets/department-selector";
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

import styles from "./styles/form-shell.module.css";

type FormValues = z.infer<typeof CreateStockTakeSchema>;

interface Props {
  initialValues?: Partial<FormValues>;
  stockTakeId?: string;
}

export default function StockTakeForm({ initialValues, stockTakeId }: Props) {
  const router = useRouter();
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
      departmentId: initialValues?.departmentId,
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
    if (cycleType !== "DEPARTMENT") form.setValue("departmentId", undefined);
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
      const action =
        isEdit && stockTakeId
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
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this stock take</AlertTitle>
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
                <h3>{isEdit ? "Edit stock take" : "New stock take"}</h3>
                <p className={styles.formCardHeadDesc}>
                  Items are populated from current inventory when you start the
                  take. Blind count hides expected quantities from counters.
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
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Where will the count run?
                      </FormLabel>
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
                      <FormLabel className={styles.fieldLabel}>Count type</FormLabel>
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
                          {CYCLE_COUNT_TYPE_OPTIONS.filter(
                            (o) => o.value !== "ZONE" || locationType === "WAREHOUSE",
                          ).map((o) => (
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
                <div className="mt-4 rounded-md border bg-muted/30 p-4 space-y-4">
                  {cycleType === "ABC_CLASS" && (
                    <FormField
                      control={form.control}
                      name="abcClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">ABC class</FormLabel>
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

                  {cycleType === "DEPARTMENT" && (
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Department</FormLabel>
                          <FormControl>
                            <DepartmentSelector
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              isDisabled={isPending}
                              placeholder="Select a department"
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            Counts on-hand variants of products in this
                            department&apos;s categories.
                          </p>
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
                          <FormLabel className="text-xs">Warehouse zone</FormLabel>
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
                            <FormLabel className="text-xs">Sample by</FormLabel>
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
                                  <RadioGroupItem
                                    value="percentage"
                                    id="sampleModePct"
                                  />
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
                              <FormLabel className="text-xs">
                                Number of items to sample
                              </FormLabel>
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
                                Capped to the number of variants with stock at the
                                location.
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
                              <FormLabel className="text-xs">
                                Percentage of inventory
                              </FormLabel>
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
                  <FormItem className="mt-4 flex items-center gap-2 rounded-md bg-amber-50/50 border border-amber-100 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isPending}
                      className="h-4 w-4 accent-amber-600"
                      id="blindCount"
                    />
                    <label
                      htmlFor="blindCount"
                      className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      {field.value ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      Blind count (counters can&apos;t see expected quantity)
                    </label>
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={styles.fieldLabel}>
                        Notes
                        <span className="opt">OPTIONAL</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. month-end count, incident trigger, auditor present."
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <ScopePreview preview={preview} loading={previewLoading} />
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
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved configuration will be lost.
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
            {isEdit ? "Save changes" : "Create stock take"}
          </Button>
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
              <>
                {" "}
                across <strong>{preview.variantCount}</strong> variant
                {preview.variantCount === 1 ? "" : "s"}
              </>
            )}
            {preview.totalExpectedQuantity != null && (
              <>
                {" "}
                (expected qty{" "}
                {Number(preview.totalExpectedQuantity).toLocaleString()})
              </>
            )}
            .
          </span>
        )}
      </div>
    </div>
  );
}
