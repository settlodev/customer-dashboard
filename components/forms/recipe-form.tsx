"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";

import StockVariantSelector, {
  type VariantMeta,
} from "@/components/widgets/stock-variant-selector";
import CompatibleUnitSelector from "@/components/widgets/compatible-unit-selector";
import ConsumptionRuleSelector from "@/components/widgets/consumption-rule-selector";
import { MultiSelect } from "@/components/ui/multi-select";

import {
  attachBomRule,
  cloneBomRule,
  closeBomRuleAttachment,
  createRecipe,
  reviseRecipe,
} from "@/lib/actions/bom-rule-actions";
import { CreateRecipeSchema } from "@/types/bom/schema";
import type { FormResponse } from "@/types/types";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import type { Product } from "@/types/product/type";
import type { BomRule, BomRuleAttachment } from "@/types/bom/type";

type FormValues = z.infer<typeof CreateRecipeSchema>;
type ItemAnchor = { variantUnitId?: string; serialTracked?: boolean };

const blankItem: FormValues["items"][number] = {
  itemCategory: "STOCK",
  stockVariantId: undefined,
  subRuleId: undefined,
  quantity: undefined,
  quantityFormula: undefined,
  unitId: undefined,
  scalesWithMultiplier: false,
  sortOrder: 0,
  notes: undefined,
  substitutes: [],
};

/**
 * Project an existing rule into the slim form shape. STOCK and SUB_RULE
 * items round-trip cleanly; PHANTOM/TEXT/DOCUMENT/NON_STOCK lines (only
 * possible if the rule was authored via the warehouse endpoint) are
 * filtered out — the slim revise contract can't represent them.
 *
 * Substitutes are stored as multipliers backend-side but authored as
 * absolute quantities in the slim UI: invert the conversion using each
 * item's own primary quantity.
 */
function ruleToFormValues(rule: BomRule): FormValues {
  return {
    name: rule.name,
    notes: rule.notes ?? "",
    items: (rule.items ?? [])
      .filter(
        (i) => i.itemCategory === "STOCK" || i.itemCategory === "SUB_RULE",
      )
      .map((i) => ({
        itemCategory: i.itemCategory as "STOCK" | "SUB_RULE",
        stockVariantId: i.stockVariantId ?? undefined,
        subRuleId: i.subRuleId ?? undefined,
        quantity: i.quantity ?? undefined,
        quantityFormula: i.quantityFormula ?? undefined,
        unitId: i.unitId ?? undefined,
        scalesWithMultiplier: i.scalesWithMultiplier ?? false,
        sortOrder: i.sortOrder ?? 0,
        notes: i.notes ?? undefined,
        substitutes: (i.substitutes ?? []).map((s) => ({
          stockVariantId: s.stockVariantId,
          quantity:
            i.quantity != null && s.conversionFactor != null
              ? Number(i.quantity) * Number(s.conversionFactor)
              : undefined,
          notes: s.notes ?? undefined,
        })),
      })),
    // Seed the picker with the variants currently bound — open attachments
    // (no effectiveTo) only. The submit handler diffs this initial set
    // against what the operator submits to drive attach/close.
    attachments: (rule.attachments ?? [])
      .filter((a) => !a.effectiveTo && a.productVariantId)
      .map((a) => ({
        productVariantId: a.productVariantId ?? undefined,
        modifierOptionId: undefined,
        effectiveFrom: undefined,
        effectiveTo: undefined,
        notes: undefined,
      })),
  };
}

interface RecipeFormProps {
  /** Existing rule to edit. Omit for create mode. */
  rule?: BomRule | null;
  /**
   * Drawer/dialog mode: invoked with the freshly-created rule instead of
   * navigating to /bom-rules. The host owns redirect / sheet-close. Only
   * fires on create; revise paths still navigate as before.
   */
  onCreated?: (rule: BomRule) => void;
  /**
   * Hide the product-variant multi-select. Use when the host is the
   * product form itself — the parent attaches the new rule to the
   * variant being edited via attachBomRule() after product save, so
   * picking attachments here would be redundant and confusing.
   */
  hideAttachments?: boolean;
}

export default function RecipeForm({
  rule,
  onCreated,
  hideAttachments,
}: RecipeFormProps = {}) {
  const isEdit = !!rule;
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCloning, startClone] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  // Variant metadata per item index — drives the unit selector's anchor so
  // the operator only sees units convertible to the picked stock's base unit.
  const [itemAnchors, setItemAnchors] = useState<Record<number, ItemAnchor>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<number, boolean>>({});

  // Product variant catalogue powers the multi-attach selector. Fetched
  // once on mount and flattened to (label="Product · Variant", value=id).
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    fetchAllProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const variantOptions = useMemo(
    () =>
      products.flatMap((p) =>
        (p.variants ?? [])
          .filter((v) => !v.archivedAt)
          .map((v) => ({
            label: `${p.name} · ${v.name}`,
            value: v.id,
          })),
      ),
    [products],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateRecipeSchema) as never,
    defaultValues: rule
      ? ruleToFormValues(rule)
      : {
          name: "",
          notes: "",
          items: [{ ...blankItem }],
          attachments: [],
        },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  const setAnchor = useCallback((index: number, meta: VariantMeta | null) => {
    setItemAnchors((prev) => ({
      ...prev,
      [index]: meta
        ? { variantUnitId: meta.unitId, serialTracked: meta.serialTracked }
        : {},
    }));
  }, []);

  const handleInvalid = useCallback(
    (errors: FieldErrors<FormValues>) => {
      const firstError =
        errors.name?.message ||
        errors.items?.message ||
        errors.attachments?.message ||
        "Please fix the highlighted fields";
      toast({
        variant: "destructive",
        title: "Form invalid",
        description: String(firstError),
      });
    },
    [toast],
  );

  const onSubmit = (values: FormValues) => {
    const cleanedAttachments = values.attachments.filter(
      (a) => a.productVariantId || a.modifierOptionId,
    );
    const cleaned: FormValues = {
      ...values,
      // Edit-mode revise carries no attachments[] (the slim revise DTO
      // doesn't accept them — existing bindings auto-rebind server-side).
      // We diff and apply attach/close ourselves after the revise lands.
      attachments: isEdit ? [] : cleanedAttachments,
    };

    startTransition(async () => {
      if (isEdit && rule) {
        const result = (await reviseRecipe(rule.id, {
          name: cleaned.name,
          notes: cleaned.notes,
          items: cleaned.items,
        })) as FormResponse | undefined;
        setResponse(result);
        if (result?.responseType === "success") {
          // Sync variant bindings against what the operator picked.
          // The new rule comes back on `data` — its attachments array
          // already reflects the auto-rebind that happened server-side,
          // so we close the ones the operator removed (looked up by
          // productVariantId on the post-rebind list) and attach the
          // newly-picked ones to the new revision.
          const newRule = result.data as BomRule | undefined;
          const initialVariantIds = new Set(
            (rule.attachments ?? [])
              .filter((a) => !a.effectiveTo && a.productVariantId)
              .map((a) => a.productVariantId as string),
          );
          const submittedVariantIds = new Set(
            cleanedAttachments
              .map((a) => a.productVariantId)
              .filter((id): id is string => !!id),
          );
          const toRemove = [...initialVariantIds].filter(
            (id) => !submittedVariantIds.has(id),
          );
          const toAdd = [...submittedVariantIds].filter(
            (id) => !initialVariantIds.has(id),
          );

          if (newRule && (toRemove.length || toAdd.length)) {
            const openOnNew: BomRuleAttachment[] = (
              newRule.attachments ?? []
            ).filter((a) => !a.effectiveTo);
            for (const variantId of toRemove) {
              const att = openOnNew.find(
                (a) => a.productVariantId === variantId,
              );
              if (att) await closeBomRuleAttachment(att.id);
            }
            for (const variantId of toAdd) {
              await attachBomRule(newRule.id, {
                productVariantId: variantId,
                modifierOptionId: null,
                effectiveFrom: null,
                effectiveTo: null,
                notes: null,
              });
            }
          }

          toast({
            variant: "default",
            title: "Consumption rule revised",
            description: result.message,
          });
          router.push("/bom-rules");
        } else if (result?.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Could not revise consumption rule",
            description: result.message,
          });
        }
        return;
      }

      const result = (await createRecipe(cleaned)) as FormResponse | undefined;
      setResponse(result);
      if (result?.responseType === "success") {
        toast({
          variant: "default",
          title: "Consumption rule created",
          description: result.message,
        });
        const created = result.data as BomRule | undefined;
        if (onCreated && created) {
          onCreated(created);
        } else {
          router.push("/bom-rules");
        }
      } else if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not create consumption rule",
          description: result.message,
        });
      }
    });
  };

  const handleClone = () => {
    if (!rule) return;
    startClone(async () => {
      const result = (await cloneBomRule(rule.id)) as FormResponse | undefined;
      if (result?.responseType === "success") {
        toast({
          variant: "default",
          title: "Cloned",
          description: result.message,
        });
        // The action returns the cloned rule on `data` — jump straight to
        // its detail page so the operator can edit the copy without
        // hunting for it in the list.
        const cloned = result.data as { id?: string } | undefined;
        if (cloned?.id) {
          router.push(`/bom-rules/${cloned.id}`);
        } else {
          router.push("/bom-rules");
        }
      } else if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not clone",
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleInvalid)}
        className="space-y-6"
      >
        {response?.responseType === "error" && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertTriangle className="h-4 w-4" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Save failed</AlertTitle>
              <AlertDescription>{response.message}</AlertDescription>
            </AlertBody>
          </Alert>
        )}

        {/* ── Basics ────────────────────────────────────────────────── */}
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <header>
            <h2 className="text-base font-semibold">Consumption rule</h2>
            <p className="text-sm text-muted-foreground">
              {hideAttachments
                ? "Name the rule and list its ingredients. It'll be attached to this variant when you save the product."
                : "Name the consumption rule and (optionally) attach it to the product variants it sells as. Stock is deducted automatically when those variants sell."}
            </p>
          </header>

          <div className={hideAttachments ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Consumption rule name{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Cup of Tea"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!hideAttachments && (
              <FormField
                control={form.control}
                name="attachments"
                render={() => {
                  const watched = form.watch("attachments") ?? [];
                  const selected = watched
                    .map((a) => a?.productVariantId)
                    .filter((id): id is string => !!id);
                  return (
                    <FormItem>
                      <FormLabel>
                        {isEdit
                          ? "Product variants attached"
                          : "Product (optional)"}
                      </FormLabel>
                      <FormControl>
                        <MultiSelect
                          // `key` forces a re-mount when the seed set
                          // changes (e.g. after a successful revise that
                          // returned a new rule); MultiSelect is internally
                          // stateful and only reads `defaultValue` once.
                          key={selected.join(",")}
                          options={variantOptions}
                          defaultValue={selected}
                          onValueChange={(ids) =>
                            form.setValue(
                              "attachments",
                              ids.map((vid) => ({
                                productVariantId: vid,
                                modifierOptionId: undefined,
                                effectiveFrom: undefined,
                                effectiveTo: undefined,
                                notes: undefined,
                              })),
                              { shouldValidate: true, shouldDirty: true },
                            )
                          }
                          placeholder={
                            productsLoading
                              ? "Loading product variants…"
                              : "Pick one or more variants this rule powers"
                          }
                          disabled={productsLoading || isPending}
                          maxCount={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anything the kitchen needs to remember"
                    disabled={isPending}
                    rows={2}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Items ────────────────────────────────────────────────── */}
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <header>
            <h2 className="text-base font-semibold">Ingredients</h2>
            <p className="text-sm text-muted-foreground">
              One row per stock item or sub-rule. Quantities scale with the
              number of items sold; flip <em>bespoke scaling</em> only when a
              per-order multiplier (e.g. a tall suit) should also apply.
            </p>
          </header>

          <div className="space-y-3">
            {items.fields.map((field, index) => {
              const anchor = itemAnchors[index] || {};
              const category = form.watch(`items.${index}.itemCategory`);
              const isStock = category === "STOCK";
              const subsExpanded = !!expandedSubs[index];
              return (
                <div
                  key={field.id}
                  className="relative rounded-md border bg-background p-3 space-y-3"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30"
                    onClick={() => {
                      items.remove(index);
                      setItemAnchors((prev) => {
                        const next = { ...prev };
                        delete next[index];
                        return next;
                      });
                    }}
                    disabled={isPending || items.fields.length === 1}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-1 gap-3 pr-10 sm:grid-cols-2 lg:grid-cols-12">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemCategory`}
                      render={({ field: f }) => (
                        <FormItem className="lg:col-span-4">
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={(v) => {
                              f.onChange(v);
                              if (v === "STOCK") {
                                form.setValue(
                                  `items.${index}.subRuleId`,
                                  undefined,
                                );
                              } else {
                                form.setValue(
                                  `items.${index}.stockVariantId`,
                                  undefined,
                                );
                                form.setValue(
                                  `items.${index}.unitId`,
                                  undefined,
                                );
                                setAnchor(index, null);
                              }
                            }}
                            value={f.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="STOCK">Stock</SelectItem>
                              <SelectItem value="SUB_RULE">
                                Sub-rule
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isStock ? (
                      <FormField
                        control={form.control}
                        name={`items.${index}.stockVariantId`}
                        render={({ field: f }) => (
                          <FormItem className="lg:col-span-8">
                            <FormLabel>
                              Stock item{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <StockVariantSelector
                                value={f.value as string | undefined}
                                onChange={(v) => f.onChange(v || undefined)}
                                onVariantMeta={(m) => setAnchor(index, m)}
                                isDisabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name={`items.${index}.subRuleId`}
                        render={({ field: f }) => (
                          <FormItem className="lg:col-span-8">
                            <FormLabel>
                              Sub-rule <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <ConsumptionRuleSelector
                                value={f.value as string | undefined}
                                onChange={(v) => f.onChange(v || undefined)}
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
                      render={({ field: f }) => (
                        <FormItem className="lg:col-span-3">
                          <FormLabel>
                            Quantity{" "}
                            {isStock && (
                              <span className="text-red-500">*</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              placeholder="0"
                              value={(f.value as number | undefined) ?? ""}
                              onChange={(e) =>
                                f.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                                )
                              }
                              disabled={isPending || !isStock}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitId`}
                      render={({ field: f }) => (
                        <FormItem className="lg:col-span-5">
                          <FormLabel>
                            Unit{" "}
                            {isStock && (
                              <span className="text-red-500">*</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <CompatibleUnitSelector
                              anchorUnitId={anchor.variantUnitId}
                              value={f.value as string | undefined}
                              onChange={(v) => f.onChange(v || undefined)}
                              isDisabled={isPending || !isStock}
                              placeholder={isStock ? "Pick a unit" : "—"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.scalesWithMultiplier`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 self-end rounded-md border border-line bg-card p-3 lg:col-span-4">
                          <FormControl>
                            <Switch
                              checked={!!f.value}
                              onCheckedChange={f.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-medium text-foreground">
                            Scaling
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {isStock && (
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedSubs((p) => ({
                            ...p,
                            [index]: !p[index],
                          }))
                        }
                        disabled={isPending}
                      >
                        {subsExpanded ? (
                          <ChevronUp className="mr-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="mr-1 h-4 w-4" />
                        )}
                        Substitutes (
                        {form.watch(`items.${index}.substitutes`)?.length ?? 0})
                      </Button>
                    </div>
                  )}

                  {isStock && subsExpanded && (
                    <SubstitutesEditor
                      control={form.control}
                      itemIndex={index}
                      isPending={isPending}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => items.append({ ...blankItem })}
            disabled={isPending}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add ingredient
          </Button>
        </section>

        <div className="flex justify-end gap-2">
          {/* Drawer/dialog hosts (onCreated set) own their own close
              affordance via the sheet X — we hide the in-form discard so
              we don't ship two cancel buttons. */}
          {!onCreated && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  title="Discard changes and go back"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Discard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent tone="danger">
                <AlertDialogIcon>
                  <Trash2 className="h-5 w-5" />
                </AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Unsaved changes will be lost. This cannot be undone.
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
          )}
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isCloning}
              onClick={handleClone}
              title="Create a fresh rule with the same content"
            >
              <Copy className="mr-1.5 h-4 w-4" />
              {isCloning ? "Cloning…" : "Clone as new rule"}
            </Button>
          )}
          <Button type="submit" disabled={isPending || isCloning}>
            {isPending ? (
              "Saving…"
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {isEdit ? "Save revision" : "Create consumption rule"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface SubsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  itemIndex: number;
  isPending: boolean;
}

function SubstitutesEditor({ control, itemIndex, isPending }: SubsProps) {
  const subs = useFieldArray({
    control,
    name: `items.${itemIndex}.substitutes`,
  });

  return (
    <div className="rounded border bg-muted/30 p-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        When the primary is out of stock, the resolver picks whichever
        substitute currently has the most on-hand. Enter how much of the
        substitute to deduct when it gets chosen — leave blank for a 1:1
        swap.
      </p>
      {subs.fields.map((field, sIndex) => (
        <div
          key={field.id}
          className="relative rounded-md border bg-background p-3"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/30"
            onClick={() => subs.remove(sIndex)}
            disabled={isPending}
            aria-label="Remove substitute"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="grid grid-cols-1 gap-3 pr-10 sm:grid-cols-2 lg:grid-cols-12">
            <FormField
              control={control}
              name={`items.${itemIndex}.substitutes.${sIndex}.stockVariantId`}
              render={({ field: f }) => (
                <FormItem className="lg:col-span-8">
                  <FormLabel className="text-xs">
                    Substitute variant{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <StockVariantSelector
                      value={f.value as string | undefined}
                      onChange={(v) => f.onChange(v || undefined)}
                      isDisabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`items.${itemIndex}.substitutes.${sIndex}.quantity`}
              render={({ field: f }) => (
                <FormItem className="lg:col-span-4">
                  <FormLabel className="text-xs">
                    Quantity to deduct
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="1:1 swap"
                      value={(f.value as number | undefined) ?? ""}
                      onChange={(e) =>
                        f.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
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
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          subs.append({
            stockVariantId: "",
            quantity: undefined,
            notes: undefined,
          })
        }
        disabled={isPending}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add substitute
      </Button>
    </div>
  );
}
