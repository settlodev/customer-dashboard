"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Beaker, FlaskConical, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import {
  createConsumptionRule,
  createNewVersion,
} from "@/lib/actions/consumption-rule-actions";
import { useRouter } from "next/navigation";
import {
  ConsumptionRule,
  CONSUMPTION_TYPE_LABELS,
  CALCULATION_TYPE_LABELS,
} from "@/types/consumption-rule/type";
import { ConsumptionRuleSchema } from "@/types/consumption-rule/schema";
import { FormResponse } from "@/types/types";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import UnitSelector from "@/components/widgets/unit-selector";

interface ConsumptionRuleFormProps {
  item: ConsumptionRule | null | undefined;
}

export default function ConsumptionRuleForm({ item }: ConsumptionRuleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof ConsumptionRuleSchema>>({
    resolver: zodResolver(ConsumptionRuleSchema),
    defaultValues: {
      name: item?.name ?? "",
      consumptionType: item?.consumptionType ?? "RECIPE",
      calculationType: item?.calculationType ?? "FIXED",
      yieldQuantity: item?.yieldQuantity ?? undefined,
      yieldUnitId: item?.yieldUnitId ?? undefined,
      prepTime: item?.prepTime ?? undefined,
      wastagePercent: item?.wastagePercent ?? undefined,
      items: item?.items?.length
        ? item.items.map((i) => ({
            stockVariantId: i.stockVariantId,
            quantity: i.quantity ?? undefined,
            quantityFormula: i.quantityFormula,
            unitId: i.unitId,
            wastagePercent: i.wastagePercent ?? undefined,
            optional: i.optional,
            scalesWithMultiplier: i.scalesWithMultiplier,
            orderIndex: i.orderIndex,
          }))
        : [{ unitId: "", optional: false, scalesWithMultiplier: true, orderIndex: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "Please check your inputs.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof ConsumptionRuleSchema>) => {
    setResponse(undefined);

    startTransition(() => {
      if (item) {
        // Editing creates a new version
        createNewVersion(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/consumption-rules");
          }
        });
      } else {
        createConsumptionRule(values).then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/consumption-rules");
          }
        });
      }
    });
  };

  const handleAddIngredient = () => {
    append({
      unitId: "",
      optional: false,
      scalesWithMultiplier: true,
      orderIndex: fields.length,
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
        {/* ── Rule Details ────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Beaker className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input className="pl-10" placeholder="e.g. Chocolate Cake" {...field} disabled={isPending} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consumptionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONSUMPTION_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calculationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calculation <span className="text-red-500">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CALCULATION_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yieldQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yield Quantity</FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.value ? Number(v.value) : undefined)}
                        placeholder="e.g. 10"
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yieldUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yield Unit</FormLabel>
                    <FormControl>
                      <UnitSelector {...field} value={field.value ?? ""} placeholder="Select unit" isDisabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Clock className="h-3 w-3" /> Prep Time (min)</FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.value ? Number(v.value) : undefined)}
                        placeholder="0"
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wastagePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Percent className="h-3 w-3" /> Wastage %</FormLabel>
                    <FormControl>
                      <NumericFormat
                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
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
            </div>
          </CardContent>
        </Card>

        {/* ── Ingredients ─────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-gray-400" />
                  Ingredients
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add the stock items consumed by this rule
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} disabled={isPending}>
                <Plus className="w-4 h-4 mr-1" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ingredient {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1 || isPending}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Stock Variant */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.stockVariantId`}
                      render={({ field: f }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-xs">Stock Item</FormLabel>
                          <FormControl>
                            <StockVariantSelector
                              placeholder="Select stock item"
                              value={f.value ?? ""}
                              onChange={f.onChange}
                              isDisabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <NumericFormat
                              className="flex h-10 w-full rounded-md border-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                              value={f.value ?? ""}
                              onValueChange={(v) => f.onChange(v.value ? Number(v.value) : undefined)}
                              thousandSeparator
                              placeholder="0"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitId`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <UnitSelector {...f} value={f.value ?? ""} placeholder="Unit" isDisabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Advanced options row */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.optional`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch checked={f.value} onCheckedChange={f.onChange} disabled={isPending} />
                          </FormControl>
                          <FormLabel className="text-xs cursor-pointer">Optional</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.scalesWithMultiplier`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch checked={f.value} onCheckedChange={f.onChange} disabled={isPending} />
                          </FormControl>
                          <FormLabel className="text-xs cursor-pointer">Scales with multiplier</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.wastagePercent`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-xs">Waste %</FormLabel>
                          <FormControl>
                            <NumericFormat
                              className="flex h-8 w-16 rounded-md border-0 bg-white dark:bg-gray-800 px-2 text-xs"
                              value={f.value ?? ""}
                              onValueChange={(v) => f.onChange(v.value ? Number(v.value) : undefined)}
                              suffix="%"
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update rule (new version)" : "Create rule"}
          />
        </div>
      </form>
    </Form>
  );
}
