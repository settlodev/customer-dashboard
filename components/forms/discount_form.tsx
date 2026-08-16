"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NumericFormat } from "react-number-format";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  ListChecks,
  Percent,
  Plus,
  Tag,
  Target,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldLabel,
  controlInputClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
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
import { FormError } from "../widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { Discount } from "@/types/discount/type";
import { DiscountSchema } from "@/types/discount/schema";
import {
  DISCOUNT_APPLY_MODE_OPTIONS,
  DISCOUNT_CONDITION_TYPE_OPTIONS,
  DISCOUNT_RULE_TYPE_OPTIONS,
  DISCOUNT_TARGET_ENTITY_TYPE_OPTIONS,
  DISCOUNT_TARGET_TYPE_OPTIONS,
  DISCOUNT_TIER_TYPE_OPTIONS,
} from "@/types/discount/enums";
import { createDiscount, updateDiscount } from "@/lib/actions/discount-actions";
import DiscountEntityPicker from "../widgets/discount-entity-picker";
import DiscountScopePicker, { type DiscountScope } from "../widgets/discount-scope-picker";

import styles from "./styles/form-shell.module.css";

type DiscountFormValues = z.infer<typeof DiscountSchema>;

function DiscountForm({ item }: { item: Discount | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(DiscountSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? "",
          ruleType: item.ruleType,
          targetType: item.targetType,
          applyMode: item.applyMode,
          value: item.value,
          maxDiscountAmount: item.maxDiscountAmount ?? undefined,
          couponCode: item.couponCode ?? "",
          stackable: item.stackable,
          active: item.active,
          priority: item.priority,
          buyQuantity: item.buyQuantity ?? undefined,
          getQuantity: item.getQuantity ?? undefined,
          getDiscountPercentage: item.getDiscountPercentage ?? undefined,
          maxTotalUses: item.maxTotalUses ?? undefined,
          maxUsesPerCustomer: item.maxUsesPerCustomer ?? undefined,
          maxUsesPerDay: item.maxUsesPerDay ?? undefined,
          requiresApproval: item.requiresApproval,
          promotionId: item.promotionId ?? undefined,
          conditions: item.conditions.map((c) => ({
            conditionType: c.conditionType,
            operator: c.operator ?? "",
            valueText: c.valueText ?? "",
            valueNumeric: c.valueNumeric ?? undefined,
            valueTimeFrom: c.valueTimeFrom ?? "",
            valueTimeTo: c.valueTimeTo ?? "",
            valueIds: c.valueIds ?? [],
          })),
          targets: item.targets.map((t) => ({
            targetEntityType: t.targetEntityType,
            targetEntityId: t.targetEntityId,
          })),
          tiers: item.tiers.map((t) => ({
            minThreshold: t.minThreshold,
            discountType: t.discountType,
            discountValue: t.discountValue,
            sortOrder: t.sortOrder,
          })),
          expectedVersion: item.version,
        }
      : {
          name: "",
          description: "",
          ruleType: "PERCENTAGE",
          targetType: "ORDER",
          applyMode: "AUTO",
          value: 0,
          maxDiscountAmount: undefined,
          couponCode: "",
          stackable: true,
          active: true,
          priority: 0,
          buyQuantity: undefined,
          getQuantity: undefined,
          getDiscountPercentage: undefined,
          maxTotalUses: undefined,
          maxUsesPerCustomer: undefined,
          maxUsesPerDay: undefined,
          requiresApproval: false,
          promotionId: undefined,
          conditions: [],
          targets: [],
          tiers: [],
        },
  });

  const targetsArray = useFieldArray({
    control: form.control,
    name: "targets",
    keyName: "_key",
  });
  const tiersArray = useFieldArray({
    control: form.control,
    name: "tiers",
    keyName: "_key",
  });
  const conditionsArray = useFieldArray({
    control: form.control,
    name: "conditions",
    keyName: "_key",
  });

  const ruleType = form.watch("ruleType");
  const targetType = form.watch("targetType");
  const applyMode = form.watch("applyMode");

  const needsTargets =
    targetType === "SPECIFIC_PRODUCTS" || targetType === "SPECIFIC_CATEGORIES";
  const needsTiers = ruleType === "TIERED";
  const needsBuyGetY = ruleType === "BUY_X_GET_Y";
  const needsCoupon = applyMode === "COUPON";

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const submitData = (values: DiscountFormValues) => {
    setResponse(undefined);
    startTransition(async () => {
      try {
        const result = item
          ? await updateDiscount(item.id, values)
          : await createDiscount(values);
        if (result.responseType === "success") {
          toast({
            variant: "success",
            title: "Success",
            description: result.message,
          });
          router.push("/discounts");
        } else {
          setResponse(result);
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          {/* ── Discount details ──────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Tag className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Discount details</h3>
                <p className={styles.formCardHeadDesc}>
                  Name and internal description for this discount rule.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 space-y-[7px]">
                      <FieldLabel required>Discount name</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="e.g. Weekend 10% off"
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Priority</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-4 space-y-[7px]">
                    <FieldLabel optional>Description</FieldLabel>
                    <FormControl>
                      <ControlTextarea
                        placeholder="Internal note describing this discount"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <FormField
                  control={form.control}
                  name="stackable"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-line bg-card p-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="min-w-0 space-y-0.5">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Stackable
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Can combine with other discounts.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-line bg-card p-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="min-w-0 space-y-0.5">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Requires approval
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Staff must approve before this applies.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-line bg-card p-3">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="min-w-0 space-y-0.5">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Active
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Inactive discounts never apply.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── Rule & value ──────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Percent className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Rule & value</h3>
                <p className={styles.formCardHeadDesc}>
                  How the discount is calculated and how it&apos;s applied at checkout.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="ruleType"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Rule type</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue placeholder="Select rule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCOUNT_RULE_TYPE_OPTIONS.map((o) => (
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
                  name="targetType"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Applies to</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCOUNT_TARGET_TYPE_OPTIONS.map((o) => (
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
                  name="applyMode"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>Apply mode</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue placeholder="Select apply mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCOUNT_APPLY_MODE_OPTIONS.map((o) => (
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
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel required>
                        {ruleType === "PERCENTAGE" ? "Percentage" : "Value"}
                      </FieldLabel>
                      <FormControl>
                        <ControlBox suffix={ruleType === "PERCENTAGE" ? "%" : undefined}>
                          <NumericFormat
                            className={cn(controlInputClass, "tabular-nums")}
                            value={field.value ?? ""}
                            onValueChange={(v) => field.onChange(v.floatValue ?? 0)}
                            decimalScale={2}
                            thousandSeparator=","
                            allowNegative={false}
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
                  name="maxDiscountAmount"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Max discount amount</FieldLabel>
                      <FormControl>
                        <ControlBox>
                          <NumericFormat
                            className={cn(controlInputClass, "tabular-nums")}
                            value={field.value ?? ""}
                            onValueChange={(v) => field.onChange(v.floatValue)}
                            decimalScale={2}
                            thousandSeparator=","
                            allowNegative={false}
                            placeholder="No cap"
                            disabled={isPending}
                          />
                        </ControlBox>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {needsCoupon && (
                  <FormField
                    control={form.control}
                    name="couponCode"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel required>Coupon code</FieldLabel>
                        <FormControl>
                          <ControlInput
                            placeholder="e.g. SAVE10"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {needsBuyGetY && (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-line bg-card/50 p-3 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="buyQuantity"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel required>Buy quantity</FieldLabel>
                        <FormControl>
                          <ControlInput
                            type="number"
                            min={1}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value),
                              )
                            }
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="getQuantity"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel required>Get quantity</FieldLabel>
                        <FormControl>
                          <ControlInput
                            type="number"
                            min={1}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value),
                              )
                            }
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="getDiscountPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel optional>Get item discount %</FieldLabel>
                        <FormControl>
                          <ControlBox suffix="%">
                            <NumericFormat
                              className={cn(controlInputClass, "tabular-nums")}
                              value={field.value ?? ""}
                              onValueChange={(v) => field.onChange(v.floatValue)}
                              decimalScale={2}
                              allowNegative={false}
                              placeholder="100 = free"
                              disabled={isPending}
                            />
                          </ControlBox>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Tiers ─────────────────────────────────────────────── */}
          {needsTiers && (
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Tiers</h3>
                  <p className={styles.formCardHeadDesc}>
                    Discount steps up as the qualifying amount increases.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 03</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      tiersArray.append({
                        minThreshold: 0,
                        discountType: "FIXED",
                        discountValue: 0,
                        sortOrder: tiersArray.fields.length,
                      })
                    }
                    disabled={isPending}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add tier
                  </Button>
                </div>
              </header>

              <div className={styles.formBody}>
                {tiersArray.fields.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
                    <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      Add at least one tier for a tiered discount.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tiersArray.fields.map((field, index) => (
                      <div
                        key={field._key}
                        className="space-y-3 rounded-md border border-line bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Tier {index + 1}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => index > 0 && tiersArray.move(index, index - 1)}
                              disabled={isPending || index === 0}
                              className="h-7 w-7 p-0"
                              title="Move up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                index < tiersArray.fields.length - 1 &&
                                tiersArray.move(index, index + 1)
                              }
                              disabled={isPending || index === tiersArray.fields.length - 1}
                              className="h-7 w-7 p-0"
                              title="Move down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => tiersArray.remove(index)}
                              disabled={isPending}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`tiers.${index}.minThreshold`}
                            render={({ field }) => (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel required>Min threshold</FieldLabel>
                                <FormControl>
                                  <ControlInput
                                    type="number"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tiers.${index}.discountType`}
                            render={({ field }) => (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel required>Discount type</FieldLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger className={controlSelectTriggerClass}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DISCOUNT_TIER_TYPE_OPTIONS.map((o) => (
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
                            name={`tiers.${index}.discountValue`}
                            render={({ field }) => (
                              <FormItem className="space-y-[7px]">
                                <FieldLabel required>Discount value</FieldLabel>
                                <FormControl>
                                  <ControlInput
                                    type="number"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Targets ───────────────────────────────────────────── */}
          {needsTargets && (
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <Target className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Targets</h3>
                  <p className={styles.formCardHeadDesc}>
                    Specific products or categories this discount applies to.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 04</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      targetsArray.append({
                        targetEntityType: "PRODUCT",
                        targetEntityId: "",
                      })
                    }
                    disabled={isPending}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add target
                  </Button>
                </div>
              </header>

              <div className={styles.formBody}>
                {targetsArray.fields.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
                    <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      Add at least one target for this target type.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {targetsArray.fields.map((field, index) => (
                      <div
                        key={field._key}
                        className="grid grid-cols-1 items-start gap-3 rounded-md border border-line bg-card p-3 sm:grid-cols-[1fr_2fr_auto]"
                      >
                        <FormField
                          control={form.control}
                          name={`targets.${index}.targetEntityType`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Entity type</FieldLabel>
                              <Select
                                value={field.value}
                                onValueChange={(next) => {
                                  field.onChange(next);
                                  // A previously picked id belongs to the old
                                  // entity type — clear it so the picker
                                  // below doesn't show a stale mismatched id.
                                  form.setValue(`targets.${index}.targetEntityId`, "", {
                                    shouldValidate: false,
                                  });
                                }}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger className={controlSelectTriggerClass}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DISCOUNT_TARGET_ENTITY_TYPE_OPTIONS.map((o) => (
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
                          name={`targets.${index}.targetEntityId`}
                          render={({ field }) => (
                            <FormItem className="space-y-[7px]">
                              <FieldLabel required>Entity</FieldLabel>
                              <FormControl>
                                <DiscountEntityPicker
                                  entityType={form.watch(`targets.${index}.targetEntityType`)}
                                  placeholder="Search and select…"
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  isDisabled={isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => targetsArray.remove(index)}
                          disabled={isPending}
                          className="h-9 w-9 self-end p-0 text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Usage limits ──────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <ListChecks className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Usage limits</h3>
                <p className={styles.formCardHeadDesc}>
                  Optional caps on how often this discount can be used.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 05</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="maxTotalUses"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Max total uses</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Unlimited"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUsesPerCustomer"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Max uses per customer</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Unlimited"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUsesPerDay"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel optional>Max uses per day</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Unlimited"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="promotionId"
                render={({ field }) => (
                  <FormItem className="mt-4 space-y-[7px]">
                    <FieldLabel optional>Promotion ID</FieldLabel>
                    <FormControl>
                      <ControlInput
                        placeholder="Attach to an existing promotion (optional)"
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
          </section>

          {/* ── Conditions ────────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <ListChecks className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Conditions</h3>
                <p className={styles.formCardHeadDesc}>
                  Extra rules that must hold for this discount to apply (optional).
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 06</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    conditionsArray.append({
                      conditionType: "MIN_SPEND",
                      operator: "",
                      valueText: "",
                      valueNumeric: undefined,
                      valueTimeFrom: "",
                      valueTimeTo: "",
                      valueIds: [],
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add condition
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              {conditionsArray.fields.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
                  <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs font-medium">No extra conditions.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {conditionsArray.fields.map((field, index) => (
                    <ConditionRow
                      key={field._key}
                      index={index}
                      form={form}
                      disabled={isPending}
                      onRemove={() => conditionsArray.remove(index)}
                    />
                  ))}
                </div>
              )}
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
            {isEditing ? "Update discount" : "Create discount"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ConditionRow({
  index,
  form,
  disabled,
  onRemove,
}: {
  index: number;
  form: ReturnType<typeof useForm<DiscountFormValues>>;
  disabled: boolean;
  onRemove: () => void;
}) {
  const conditionType = form.watch(`conditions.${index}.conditionType`);
  const isTimeWindow = conditionType === "TIME_WINDOW";
  const isNumeric = conditionType === "MIN_SPEND" || conditionType === "MIN_QUANTITY";
  const isScope =
    conditionType === "PRODUCT_SCOPE" ||
    conditionType === "CATEGORY_SCOPE" ||
    conditionType === "CUSTOMER_SCOPE" ||
    conditionType === "CUSTOMER_GROUP_SCOPE";

  return (
    <div className="space-y-3 rounded-md border border-line bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Condition {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`conditions.${index}.conditionType`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel required>Condition type</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger className={controlSelectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCOUNT_CONDITION_TYPE_OPTIONS.map((o) => (
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
          name={`conditions.${index}.operator`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel optional>Operator</FieldLabel>
              <FormControl>
                <ControlInput
                  placeholder="e.g. GTE, EQUALS"
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {isNumeric && (
        <FormField
          control={form.control}
          name={`conditions.${index}.valueNumeric`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel>Numeric value</FieldLabel>
              <FormControl>
                <ControlBox>
                  <NumericFormat
                    className={cn(controlInputClass, "tabular-nums")}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue)}
                    decimalScale={2}
                    thousandSeparator=","
                    allowNegative={false}
                    disabled={disabled}
                  />
                </ControlBox>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isTimeWindow && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`conditions.${index}.valueTimeFrom`}
            render={({ field }) => (
              <FormItem className="space-y-[7px]">
                <FieldLabel>From</FieldLabel>
                <FormControl>
                  <ControlInput
                    type="time"
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`conditions.${index}.valueTimeTo`}
            render={({ field }) => (
              <FormItem className="space-y-[7px]">
                <FieldLabel>To</FieldLabel>
                <FormControl>
                  <ControlInput
                    type="time"
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {!isNumeric && !isTimeWindow && (
        <FormField
          control={form.control}
          name={`conditions.${index}.valueText`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel optional>{isScope ? "Notes" : "Text value"}</FieldLabel>
              <FormControl>
                <ControlInput
                  placeholder="e.g. MONDAY, DINE_IN"
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isScope && (
        <FormField
          control={form.control}
          name={`conditions.${index}.valueIds`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel optional>
                {conditionType === "PRODUCT_SCOPE" && "Products"}
                {conditionType === "CATEGORY_SCOPE" && "Categories"}
                {conditionType === "CUSTOMER_SCOPE" && "Customers"}
                {conditionType === "CUSTOMER_GROUP_SCOPE" && "Customer groups"}
              </FieldLabel>
              <FormControl>
                <DiscountScopePicker
                  scope={conditionType as DiscountScope}
                  placeholder="Search and select…"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  isDisabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

export default DiscountForm;
