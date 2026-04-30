"use client";

import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Beaker,
  Calendar as CalendarIcon,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  Percent,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import StockVariantSelector, {
  type VariantMeta,
} from "@/components/widgets/stock-variant-selector";
import UnitSelector from "@/components/widgets/unit-selector";
import CompatibleUnitSelector from "@/components/widgets/compatible-unit-selector";

import styles from "./styles/form-shell.module.css";

import {
  createBomRule,
  reviseBomRule,
} from "@/lib/actions/bom-rule-actions";
import { CreateBomRuleSchema } from "@/types/bom/schema";
import {
  BOM_ITEM_CATEGORY_LABELS,
  BOM_OUTPUT_TYPE_LABELS,
  BOM_SUBSTITUTION_STRATEGY_LABELS,
  BomItemCategory,
  BomRule,
  LocationType,
} from "@/types/bom/type";
import { FormResponse } from "@/types/types";

type FormValues = z.infer<typeof CreateBomRuleSchema>;

interface BomRuleFormProps {
  rule: BomRule | null | undefined;
  /** Location type from LocationConfig — outputs only offered on warehouses. */
  locationType?: LocationType | null;
}

export default function BomRuleForm({ rule, locationType }: BomRuleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();

  const isWarehouse = locationType === "WAREHOUSE";
  const isEditing = !!rule;

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateBomRuleSchema) as never,
    defaultValues: {
      productVariantId: rule?.productVariantId ?? undefined,
      modifierOptionId: rule?.modifierOptionId ?? undefined,
      name: rule?.name ?? "",
      effectiveFrom: rule?.effectiveFrom ?? undefined,
      effectiveTo: rule?.effectiveTo ?? undefined,
      baseQuantity: rule?.baseQuantity ?? 1,
      baseUnitId: rule?.baseUnitId ?? "",
      notes: rule?.notes ?? undefined,
      items: rule?.items?.length
        ? rule.items.map((i) => ({
            itemNumber: i.itemNumber,
            itemCategory: i.itemCategory,
            stockVariantId: i.stockVariantId ?? undefined,
            subRuleId: i.subRuleId ?? undefined,
            quantity: i.quantity ?? undefined,
            quantityFormula: i.quantityFormula ?? undefined,
            unitId: i.unitId ?? undefined,
            componentScrapPercent: i.componentScrapPercent ?? undefined,
            operationScrapPercent: i.operationScrapPercent ?? undefined,
            fixedQuantity: i.fixedQuantity ?? false,
            scalesWithMultiplier: i.scalesWithMultiplier ?? true,
            backflushed: i.backflushed ?? true,
            substitutionStrategy: i.substitutionStrategy ?? "NONE",
            optional: i.optional ?? false,
            sortOrder: i.sortOrder ?? 0,
            notes: i.notes ?? undefined,
            text: i.text ?? undefined,
            substitutes: (i.substitutes ?? []).map((s) => ({
              stockVariantId: s.stockVariantId,
              priority: s.priority,
              usageProbability: s.usageProbability ?? undefined,
              conversionFactor: s.conversionFactor,
              notes: s.notes ?? undefined,
            })),
          }))
        : [defaultItem(0)],
      outputs: rule?.outputs?.map((o) => ({
        stockVariantId: o.stockVariantId,
        outputType: o.outputType,
        yieldQuantity: o.yieldQuantity,
        yieldUnitId: o.yieldUnitId,
        costAllocationMethod: o.costAllocationMethod ?? undefined,
        costAllocationPercent: o.costAllocationPercent ?? undefined,
        byProductValue: o.byProductValue ?? undefined,
        sortOrder: o.sortOrder ?? 0,
      })) ?? [],
      operations: rule?.operations?.map((op) => ({
        sequence: op.sequence,
        name: op.name,
        workCenter: op.workCenter ?? undefined,
        setupMinutes: op.setupMinutes ?? undefined,
        runMinutesPerUnit: op.runMinutesPerUnit ?? undefined,
        laborRatePerHour: op.laborRatePerHour ?? undefined,
        overheadRatePerHour: op.overheadRatePerHour ?? undefined,
        machineRatePerHour: op.machineRatePerHour ?? undefined,
        scrapPercent: op.scrapPercent ?? undefined,
        notes: op.notes ?? undefined,
      })) ?? [],
    },
  });

  const itemsField = useFieldArray({ control: form.control, name: "items" });
  const outputsField = useFieldArray({ control: form.control, name: "outputs" });
  const operationsField = useFieldArray({ control: form.control, name: "operations" });

  const onInvalid = useCallback(
    (_errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "Please check the highlighted fields.",
      });
    },
    [toast],
  );

  const submitData = (values: FormValues) => {
    setResponse(undefined);
    const payload = { ...values, effectiveFrom: values.effectiveFrom ?? new Date().toISOString() };

    startTransition(async () => {
      const res = isEditing
        ? await reviseBomRule(rule!.id, payload as never)
        : await createBomRule(values);
      if (res) setResponse(res);
      if (res?.responseType === "success") {
        toast({ variant: "success", title: "Success", description: res.message });
        router.push("/bom-rules");
      }
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
            <AlertTitle>We couldn&apos;t save this consumption rule</AlertTitle>
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
              <Beaker className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Rule details</h3>
              <p className={styles.formCardHeadDesc}>
                Identifies the consumption rule and its lifecycle.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 01</span>
            </div>
          </header>
          <div className={styles.formBody}>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-2">
                    <FormLabel className="text-xs">
                      Rule name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Chocolate Cake"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productVariantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Product variant</FormLabel>
                    <FormControl>
                      <StockVariantSelector
                        placeholder="Attach to product"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        isDisabled={isPending || isEditing}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Base quantity <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value ?? 1}
                        onValueChange={(v) => field.onChange(v.value ? Number(v.value) : 1)}
                        placeholder="1"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Base unit <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <UnitSelector
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Select unit"
                        isDisabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  return (
                    <FormItem>
                      <FormLabel className="text-xs">Effective from</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
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
                            onSelect={(d) => {
                              field.onChange(d ? d.toISOString() : undefined);
                              const to = form.getValues("effectiveTo");
                              if (d && to && new Date(to) < d) {
                                form.setValue("effectiveTo", undefined, { shouldDirty: true });
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => {
                  const selected = field.value ? new Date(field.value) : undefined;
                  const fromValue = form.watch("effectiveFrom");
                  const fromDate = fromValue ? new Date(fromValue) : undefined;
                  return (
                    <FormItem>
                      <FormLabel className="text-xs">Effective to</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal border-0 bg-muted hover:bg-muted/80",
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
                            onSelect={(d) => field.onChange(d ? d.toISOString() : undefined)}
                            disabled={(date) => (fromDate ? date < fromDate : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 md:col-span-3 lg:col-span-4">
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes / rationale for this revision"
                        rows={3}
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Items</h3>
              <p className={styles.formCardHeadDesc}>
                Stock components consumed by this rule. Add substitutes per
                item for resilient deduction.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>STEP 02</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => itemsField.append(defaultItem(itemsField.fields.length))}
                disabled={isPending}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add item
              </Button>
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="space-y-3">
              {itemsField.fields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  form={form}
                  index={index}
                  isPending={isPending}
                  canRemove={itemsField.fields.length > 1}
                  onRemove={() => itemsField.remove(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {isWarehouse && (
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <GitBranch className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Outputs</h3>
                <p className={styles.formCardHeadDesc}>
                  Stock materialised when a production run completes.
                  Exactly one PRIMARY; co-products and by-products as needed.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 03</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    outputsField.append({
                      stockVariantId: "",
                      outputType:
                        outputsField.fields.length === 0 ? "PRIMARY" : "CO_PRODUCT",
                      yieldQuantity: 1,
                      yieldUnitId: "",
                      sortOrder: outputsField.fields.length,
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add output
                </Button>
              </div>
            </header>
            <div className={styles.formBody}>
              <div className="space-y-3">
                {outputsField.fields.map((field, index) => (
                  <OutputRow
                    key={field.id}
                    form={form}
                    index={index}
                    isPending={isPending}
                    onRemove={() => outputsField.remove(index)}
                  />
                ))}
                {outputsField.fields.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No outputs. Sales-only rules deduct stock but don&apos;t produce new inventory.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <Wrench className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>
                Operations / routing
                <span className={styles.optionalTag}>OPTIONAL</span>
              </h3>
              <p className={styles.formCardHeadDesc}>
                Labor, overhead, and machine costs. Total = (setup + baseQty ×
                runPerUnit) / 60 × (labor + overhead + machine).
              </p>
            </div>
            <div className={styles.formCardActions}>
              <span className={styles.stepBadge}>
                {isWarehouse ? "STEP 04" : "STEP 03"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  operationsField.append({
                    sequence: operationsField.fields.length + 10,
                    name: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add operation
              </Button>
            </div>
          </header>
          <div className={styles.formBody}>
            <div className="space-y-3">
              {operationsField.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3"
                >
                  <FormField
                    control={form.control}
                    name={`operations.${index}.sequence`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Seq <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-9"
                            value={f.value ?? ""}
                            onChange={(e) =>
                              f.onChange(e.target.value ? Number(e.target.value) : undefined)
                            }
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.name`}
                    render={({ field: f }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs">
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-9"
                            placeholder="Mix / Bake / Package"
                            {...f}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.setupMinutes`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Setup (min)</FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value ?? ""}
                            onValueChange={(v) =>
                              f.onChange(v.value ? Number(v.value) : undefined)
                            }
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.runMinutesPerUnit`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Run/unit (min)</FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value ?? ""}
                            onValueChange={(v) =>
                              f.onChange(v.value ? Number(v.value) : undefined)
                            }
                            placeholder="0"
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.laborRatePerHour`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Labor/hr</FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value ?? ""}
                            onValueChange={(v) =>
                              f.onChange(v.value ? Number(v.value) : undefined)
                            }
                            placeholder="0"
                            disabled={isPending}
                            thousandSeparator
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.overheadRatePerHour`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Overhead/hr</FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value ?? ""}
                            onValueChange={(v) =>
                              f.onChange(v.value ? Number(v.value) : undefined)
                            }
                            placeholder="0"
                            disabled={isPending}
                            thousandSeparator
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`operations.${index}.machineRatePerHour`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Machine/hr</FormLabel>
                        <FormControl>
                          <NumericFormat
                            className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            value={f.value ?? ""}
                            onValueChange={(v) =>
                              f.onChange(v.value ? Number(v.value) : undefined)
                            }
                            placeholder="0"
                            disabled={isPending}
                            thousandSeparator
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => operationsField.remove(index)}
                      disabled={isPending}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
              {operationsField.fields.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No operations — routing cost contributes 0 to total.
                </p>
              )}
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
            {isEditing ? "Save as new revision" : "Create consumption rule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── Per-item row (with nested substitutes) ──────────────────────────

interface ItemRowProps {
  form: ReturnType<typeof useForm<FormValues>>;
  index: number;
  isPending: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

function ItemRow({ form, index, isPending, canRemove, onRemove }: ItemRowProps) {
  const subs = useFieldArray({
    control: form.control,
    name: `items.${index}.substitutes` as const,
  });
  const category = form.watch(`items.${index}.itemCategory`) as BomItemCategory | undefined;
  const strategy = form.watch(`items.${index}.substitutionStrategy`);
  const isStockish = category === "STOCK" || category === "NON_STOCK" || !category;
  // Variant's tracking unit drives the unit dropdown's compatibility list.
  // Set on initial render via StockVariantSelector's onVariantMeta callback
  // (fires for both user picks and edit-mode value resolution).
  const [anchorUnitId, setAnchorUnitId] = useState<string | undefined>(undefined);

  return (
    <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Item {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove || isPending}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
        <FormField
          control={form.control}
          name={`items.${index}.itemNumber`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                No. <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  className="h-9"
                  placeholder="0010"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`items.${index}.itemCategory`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(BOM_ITEM_CATEGORY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        {isStockish && (
          <FormField
            control={form.control}
            name={`items.${index}.stockVariantId`}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-xs">
                  Stock item {category === "STOCK" && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <StockVariantSelector
                    placeholder="Select stock item"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onVariantMeta={(m: VariantMeta | null) =>
                      setAnchorUnitId(m?.unitId)
                    }
                    isDisabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Quantity</FormLabel>
              <FormControl>
                <NumericFormat
                  className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v.value ? Number(v.value) : undefined)}
                  placeholder="0"
                  disabled={isPending}
                  thousandSeparator
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`items.${index}.unitId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Unit</FormLabel>
              <FormControl>
                <CompatibleUnitSelector
                  anchorUnitId={anchorUnitId}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Unit"
                  isDisabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {category === "TEXT" && (
          <FormField
            control={form.control}
            name={`items.${index}.text`}
            render={({ field }) => (
              <FormItem className="md:col-span-6">
                <FormLabel className="text-xs">Text</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[60px]"
                    placeholder="Note or instruction shown alongside the rule"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`items.${index}.substitutionStrategy`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Substitution</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(BOM_SUBSTITUTION_STRATEGY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`items.${index}.componentScrapPercent`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" /> Scrap %
              </FormLabel>
              <FormControl>
                <NumericFormat
                  className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v.value ? Number(v.value) : undefined)}
                  suffix="%"
                  placeholder="0%"
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3 md:col-span-3 md:justify-end md:pt-5">
          <FormField
            control={form.control}
            name={`items.${index}.optional`}
            render={({ field: f }) => (
              <FormItem className="flex items-center gap-1.5 space-y-0">
                <FormControl>
                  <Switch checked={!!f.value} onCheckedChange={f.onChange} disabled={isPending} />
                </FormControl>
                <FormLabel className="text-xs cursor-pointer">Optional</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`items.${index}.scalesWithMultiplier`}
            render={({ field: f }) => (
              <FormItem className="flex items-center gap-1.5 space-y-0">
                <FormControl>
                  <Switch
                    checked={f.value !== false}
                    onCheckedChange={f.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormLabel className="text-xs cursor-pointer">Scales</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`items.${index}.backflushed`}
            render={({ field: f }) => (
              <FormItem className="flex items-center gap-1.5 space-y-0">
                <FormControl>
                  <Switch
                    checked={f.value !== false}
                    onCheckedChange={f.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormLabel className="text-xs cursor-pointer">Backflush</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Substitutes — only surface when strategy is non-NONE */}
      {strategy && strategy !== "NONE" && (
        <div className="pt-2 border-t mt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Substitutes ({BOM_SUBSTITUTION_STRATEGY_LABELS[strategy]})
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                subs.append({
                  stockVariantId: "",
                  priority: 100 + subs.fields.length * 10,
                  conversionFactor: 1,
                })
              }
              disabled={isPending}
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add substitute
            </Button>
          </div>
          {subs.fields.map((sf, si) => (
            <div
              key={sf.id}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mb-2"
            >
              <FormField
                control={form.control}
                name={`items.${index}.substitutes.${si}.stockVariantId`}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormControl>
                      <StockVariantSelector
                        placeholder="Substitute variant"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        isDisabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.substitutes.${si}.priority`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        className="h-9"
                        placeholder="Priority"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.substitutes.${si}.conversionFactor`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NumericFormat
                        className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        value={field.value ?? 1}
                        onValueChange={(v) =>
                          field.onChange(v.value ? Number(v.value) : undefined)
                        }
                        placeholder="1.0"
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <button
                type="button"
                onClick={() => subs.remove(si)}
                disabled={isPending}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 justify-self-end self-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {subs.fields.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              None yet. Without substitutes, a stockout on the primary blocks deduction.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-output row ──────────────────────────────────────────────────

interface OutputRowProps {
  form: ReturnType<typeof useForm<FormValues>>;
  index: number;
  isPending: boolean;
  onRemove: () => void;
}

function OutputRow({ form, index, isPending, onRemove }: OutputRowProps) {
  const [anchorUnitId, setAnchorUnitId] = useState<string | undefined>(undefined);

  return (
    <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
      <FormField
        control={form.control}
        name={`outputs.${index}.stockVariantId`}
        render={({ field: f }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="text-xs">
              Variant <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <StockVariantSelector
                placeholder="Output variant"
                value={f.value ?? ""}
                onChange={f.onChange}
                onVariantMeta={(m: VariantMeta | null) =>
                  setAnchorUnitId(m?.unitId)
                }
                isDisabled={isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`outputs.${index}.outputType`}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel className="text-xs">Type</FormLabel>
            <Select value={f.value} onValueChange={f.onChange}>
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(BOM_OUTPUT_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`outputs.${index}.yieldQuantity`}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel className="text-xs">
              Qty <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <NumericFormat
                className="flex h-9 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                value={f.value ?? ""}
                onValueChange={(v) =>
                  f.onChange(v.value ? Number(v.value) : undefined)
                }
                placeholder="1"
                disabled={isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`outputs.${index}.yieldUnitId`}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel className="text-xs">
              Unit <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <CompatibleUnitSelector
                anchorUnitId={anchorUnitId}
                value={f.value ?? ""}
                onChange={f.onChange}
                placeholder="Unit"
                isDisabled={isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-end justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={isPending}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function defaultItem(orderIndex: number) {
  return {
    itemNumber: String((orderIndex + 1) * 10).padStart(4, "0"),
    itemCategory: "STOCK" as BomItemCategory,
    substitutionStrategy: "NONE" as const,
    fixedQuantity: false,
    scalesWithMultiplier: true,
    backflushed: true,
    optional: false,
    sortOrder: orderIndex,
    substitutes: [] as never[],
  };
}

