"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Save,
  Trash2,
  Tag as TagIcon,
  Layers,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ControlBox,
  ControlInput,
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
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import type { AddonGroup } from "@/types/product/type";
import {
  AddonGroupSchema,
  type AddonGroupInput,
  type AddonGroupItemInput,
} from "@/types/product/schema";
import type { FormResponse } from "@/types/types";

import { saveAddonGroupWithItems } from "@/lib/actions/addon-actions";

import styles from "./styles/form-shell.module.css";

export interface ProductVariantOption {
  id: string;
  label: string;
  /** Sale price the variant currently advertises in its native currency
   *  — used to surface a "below natural price" hint when the merchant
   *  sets a priceOverride. */
  price?: number | null;
  /** Cost basis from the linked stock variant when known — used for the
   *  "below cost" guard rail. */
  costPrice?: number | null;
}

interface Props {
  group: AddonGroup | null;
  productVariants: ProductVariantOption[];
  /**
   * Drawer/dialog mode: invoked with the freshly-created group instead
   * of navigating to /addon-groups/{id}. The host owns sheet-close and
   * any "now attach to product" follow-up. Only fires on create; the
   * edit path still navigates as before.
   */
  onCreated?: (group: AddonGroup) => void;
}

const BLANK_ITEM: AddonGroupItemInput = {
  productVariantId: "",
  priceOverride: undefined,
  isDefault: false,
  sortOrder: 0,
  active: true,
};

function itemFromExisting(
  i: AddonGroup["items"][number],
): AddonGroupItemInput {
  return {
    id: i.id,
    productVariantId: i.productVariantId,
    priceOverride: i.priceOverride ?? undefined,
    isDefault: i.isDefault,
    sortOrder: i.sortOrder,
    active: i.active,
  };
}

export function AddonGroupForm({ group, productVariants, onCreated }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = React.useState<FormResponse | undefined>();

  const isEditing = !!group;
  const isArchived = group?.archivedAt != null;

  const form = useForm<AddonGroupInput>({
    resolver: zodResolver(AddonGroupSchema),
    defaultValues: group
      ? {
          id: group.id,
          name: group.name,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          sortOrder: group.sortOrder,
          active: group.active,
          items: (group.items ?? []).map(itemFromExisting),
        }
      : {
          name: "",
          minSelections: 0,
          maxSelections: 10,
          sortOrder: 0,
          active: true,
          // Pre-load one blank item so the user lands on a fillable
          // editor instead of an empty placeholder + extra click.
          items: [{ ...BLANK_ITEM, sortOrder: 0 }],
        },
  });

  const itemsArray = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "_key",
  });

  // Live snapshot of the bounds + defaults — drives the Required
  // toggle, the locked-default rule when a required-min is on, and the
  // top-of-section error banner.
  const minSelections = form.watch("minSelections");
  const maxSelections = form.watch("maxSelections");
  const watchedItems = form.watch("items") ?? [];
  const isRequired = (minSelections ?? 0) >= 1;
  const defaultsCount = watchedItems.filter((i) => i?.isDefault).length;
  const tooManyDefaults =
    defaultsCount > 0 && defaultsCount > (maxSelections ?? 0);
  const tooFewDefaults = isRequired && defaultsCount < (minSelections ?? 0);

  // Already-picked variant ids — drives both the duplicate-prevention
  // in each row's Variant select and inline error states.
  const usedVariantIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const i of watchedItems) {
      if (i?.productVariantId) ids.add(i.productVariantId);
    }
    return ids;
  }, [watchedItems]);

  const onInvalid = (errors: FieldErrors) => {
    console.warn("Addon group validation errors", errors);
  };

  const submit = (values: AddonGroupInput) => {
    setResponse(undefined);
    startTransition(async () => {
      const result = await saveAddonGroupWithItems(group?.id ?? null, values);
      if ("responseType" in result && result.responseType === "error") {
        setResponse(result);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }
      const saved = result as AddonGroup;
      toast({
        title: isEditing ? "Saved" : "Created",
        description: `${saved.name} ${isEditing ? "updated" : "created"}.`,
      });
      if (onCreated && !isEditing) {
        onCreated(saved);
      } else {
        router.push(`/addon-groups/${saved.id}`);
      }
    });
  };

  // When flipping Required on, ensure at least minSelections defaults
  // exist so the group ships in a valid bundled state. Auto-promote the
  // first N items (in the order they're listed) to fill the gap.
  const ensureRequiredDefaults = () => {
    const min = form.getValues("minSelections") ?? 0;
    if (min < 1) return;
    const items = form.getValues("items") ?? [];
    const currentDefaults = items.filter((i) => i?.isDefault).length;
    if (currentDefaults >= min) return;
    let promoted = currentDefaults;
    for (let i = 0; i < items.length && promoted < min; i++) {
      if (!items[i]?.isDefault && items[i]?.active !== false) {
        form.setValue(`items.${i}.isDefault`, true, {
          shouldDirty: true,
          shouldValidate: false,
        });
        promoted++;
      }
    }
  };

  const handleRequiredToggle = (on: boolean) => {
    form.setValue("minSelections", on ? 1 : 0, { shouldValidate: true });
    // When flipping required ON, raise max to ≥ 1 and ensure min ≤ max.
    if (on && (form.getValues("maxSelections") ?? 0) < 1) {
      form.setValue("maxSelections", 1, { shouldValidate: false });
    }
    if (on) ensureRequiredDefaults();
  };

  const handleAddItem = () => {
    itemsArray.append({
      ...BLANK_ITEM,
      sortOrder: itemsArray.fields.length,
    });
  };

  const handleRemoveItem = (index: number) => {
    itemsArray.remove(index);
  };

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= itemsArray.fields.length) return;
    itemsArray.move(index, next);
  };

  const handleDiscard = () => {
    router.back();
  };

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this group</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(submit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          {/* ── Group details ─────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <TagIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Group details</h3>
                <p className={styles.formCardHeadDesc}>
                  Companion items the customer can tack on (sides, drinks,
                  extras).
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
                {isEditing && group?.attachedProductCount != null && (
                  <Badge
                    variant="soft"
                    title="Editing this group affects every product it's attached to"
                    className="shrink-0"
                  >
                    {group.attachedProductCount === 0
                      ? "Not in use"
                      : `Used by ${group.attachedProductCount} product${
                          group.attachedProductCount === 1 ? "" : "s"
                        }`}
                  </Badge>
                )}
                {isArchived && (
                  <Badge variant="soft" className="shrink-0">
                    Archived
                  </Badge>
                )}
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="min-w-0 sm:col-span-2 space-y-[7px]">
                      <FieldLabel required>Name</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="e.g. Sides, Drinks, Bundle picks"
                          {...field}
                          disabled={isPending || isArchived}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minSelections"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Min</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={0}
                          max={maxSelections ?? undefined}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isPending || isArchived}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSelections"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Max</FieldLabel>
                      <FormControl>
                        <ControlInput
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isPending || isArchived}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Required? convenience toggle — flips min between 0 and 1. */}
              <div className="mt-3.5 flex items-center gap-3 rounded-md border border-line bg-card px-3 py-2">
                <Switch
                  checked={isRequired}
                  onCheckedChange={handleRequiredToggle}
                  disabled={isPending || isArchived}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Required</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isRequired
                      ? "Customer must pick at least one item — set defaults below to ship with a starter selection."
                      : "Customer can skip the group entirely."}
                  </p>
                </div>
              </div>

              {/* Active switch — only on edit. New groups default to
                  active and the toggle lives on the list. */}
              {isEditing && (
                <div className="mt-3.5">
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-lg border border-line bg-card p-3">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending || isArchived}
                          />
                        </FormControl>
                        <div className="space-y-0.5 min-w-0">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Active
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Inactive groups stay attached to products but
                            won&apos;t show to customers.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Items ─────────────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Items</h3>
                <p className={styles.formCardHeadDesc}>
                  Pick the product variants the customer can add. Defaults
                  ship pre-checked.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={isPending || isArchived}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add item
                </Button>
              </div>
            </header>

            <div className={styles.formBody}>
              {tooManyDefaults && (
                <Alert tone="danger" className="mb-3">
                  <AlertIcon>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </AlertIcon>
                  <AlertBody>
                    <AlertTitle>Too many defaults</AlertTitle>
                    <AlertDescription>
                      You&apos;ve pre-selected {defaultsCount} item
                      {defaultsCount === 1 ? "" : "s"} but the group caps at{" "}
                      {maxSelections}. Raise the max or unmark some defaults.
                    </AlertDescription>
                  </AlertBody>
                </Alert>
              )}
              {tooFewDefaults && (
                <Alert tone="warning" className="mb-3">
                  <AlertIcon>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </AlertIcon>
                  <AlertBody>
                    <AlertTitle>Required group needs defaults</AlertTitle>
                    <AlertDescription>
                      Pre-select at least {minSelections} item
                      {minSelections === 1 ? "" : "s"} so this required group
                      ships in a valid state.
                    </AlertDescription>
                  </AlertBody>
                </Alert>
              )}

              {itemsArray.fields.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
                  <TagIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">No items yet</p>
                    <p className="text-[11px] text-muted-foreground">
                      Add at least one variant so customers have something to
                      pick.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {itemsArray.fields.map((field, index) => (
                    <ItemRow
                      key={field._key}
                      index={index}
                      total={itemsArray.fields.length}
                      form={form}
                      productVariants={productVariants}
                      usedVariantIds={usedVariantIds}
                      defaultsCount={defaultsCount}
                      minSelections={minSelections ?? 0}
                      maxSelections={maxSelections ?? 0}
                      disabled={isPending || isArchived}
                      onRemove={() => handleRemoveItem(index)}
                      onMoveUp={() => handleMoveItem(index, -1)}
                      onMoveDown={() => handleMoveItem(index, 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Footer actions ────────────────────────────────────── */}
          <div className="flex justify-end gap-2">
            {/* Drawer/dialog hosts (onCreated set) own their own close
                affordance via the sheet X — hide the inner Discard so we
                don't ship two cancel buttons. */}
            {!onCreated && (
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
                    <AlertDialogTitle>
                      {isEditing
                        ? "Discard your changes?"
                        : "Discard this group?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isEditing
                        ? "Unsaved edits to this group will be lost. This cannot be undone."
                        : "This new group and its items will be lost. This cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDiscard}>
                      Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              type="submit"
              disabled={
                isPending || isArchived || itemsArray.fields.length === 0
              }
              title={
                itemsArray.fields.length === 0
                  ? "Add at least one item before saving"
                  : undefined
              }
            >
              <Save className="mr-1.5 h-4 w-4" />
              {isEditing ? "Save changes" : "Create group"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

interface ItemRowProps {
  index: number;
  total: number;
  form: ReturnType<typeof useForm<AddonGroupInput>>;
  productVariants: ProductVariantOption[];
  usedVariantIds: Set<string>;
  defaultsCount: number;
  minSelections: number;
  maxSelections: number;
  disabled: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ItemRow({
  index,
  total,
  form,
  productVariants,
  usedVariantIds,
  defaultsCount,
  minSelections,
  maxSelections,
  disabled,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ItemRowProps) {
  const myVariantId = form.watch(`items.${index}.productVariantId`);
  const myOverride = form.watch(`items.${index}.priceOverride`);
  const isDefault = !!form.watch(`items.${index}.isDefault`);
  const isActive = form.watch(`items.${index}.active`) !== false;

  // Filter out variants already taken by other rows so the merchant
  // can't accidentally pick the same one twice. Always keep the row's
  // own selection visible so the trigger can render it.
  const variantOptions = React.useMemo(
    () =>
      productVariants.filter(
        (v) => v.id === myVariantId || !usedVariantIds.has(v.id),
      ),
    [productVariants, usedVariantIds, myVariantId],
  );
  const myVariant = React.useMemo(
    () => productVariants.find((v) => v.id === myVariantId),
    [productVariants, myVariantId],
  );

  // Soft warning when the override drops below the variant's known cost
  // basis — easy money-loss bug to ship otherwise. Stays a hint, not a
  // hard block; some merchants intentionally loss-lead.
  const overrideBelowCost =
    myOverride != null &&
    myVariant?.costPrice != null &&
    myOverride < myVariant.costPrice;

  // Lock Default OFF→ON once we've hit the maxSelections cap. Already-on
  // rows stay editable so the merchant can swap which items are pre-checked.
  const capHit = !isDefault && defaultsCount >= maxSelections;

  // Lock Default ON→OFF when removal would drop below minSelections in
  // a required group. Forces the merchant to flip another item on first.
  const wouldUnderflowMin =
    isDefault && minSelections >= 1 && defaultsCount <= minSelections;

  // Active↔Default trap: marking a row Default also activates it (POS
  // can't pre-check an inactive item). Toggling Active off clears
  // Default at the same time so the data layer never carries the
  // contradictory inactive+default pair.
  const handleDefaultChange = (next: boolean) => {
    form.setValue(`items.${index}.isDefault`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (next && !isActive) {
      form.setValue(`items.${index}.active`, true, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  };

  const handleActiveChange = (next: boolean) => {
    form.setValue(`items.${index}.active`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!next && isDefault) {
      form.setValue(`items.${index}.isDefault`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-line bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Item {index + 1}
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {index + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FormItem
            className="!mt-0 flex items-center gap-1.5"
            title={
              wouldUnderflowMin
                ? `At least ${minSelections} default${minSelections === 1 ? "" : "s"} required — flip another item on first`
                : capHit
                  ? `Already at ${maxSelections} default${maxSelections === 1 ? "" : "s"}`
                  : undefined
            }
          >
            <Switch
              checked={isDefault}
              onCheckedChange={handleDefaultChange}
              disabled={disabled || capHit || wouldUnderflowMin}
            />
            <span className="text-xs text-muted-foreground">Default</span>
          </FormItem>
          <FormItem className="!mt-0 flex items-center gap-1.5">
            <Switch
              checked={isActive}
              onCheckedChange={handleActiveChange}
              disabled={disabled}
            />
            <span className="text-xs text-muted-foreground">Active</span>
          </FormItem>
          <div className="ml-1 flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={disabled || index === 0}
              className="h-7 w-7 p-0"
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={disabled || index === total - 1}
              className="h-7 w-7 p-0"
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`items.${index}.productVariantId`}
          render={({ field }) => (
            <FormItem className="min-w-0 space-y-[7px]">
              <FieldLabel required>Product variant</FieldLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className={controlSelectTriggerClass}>
                    <SelectValue placeholder="Pick a variant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {variantOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
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
          name={`items.${index}.priceOverride`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel>Price override (optional)</FieldLabel>
              <FormControl>
                <ControlBox>
                  <NumericFormat
                    className={cn(controlInputClass, "tabular-nums")}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue)}
                    decimalScale={4}
                    thousandSeparator=","
                    allowNegative={false}
                    placeholder={
                      myVariant?.price != null
                        ? `Native: ${myVariant.price.toLocaleString()}`
                        : "Use variant's native price"
                    }
                    disabled={disabled}
                  />
                </ControlBox>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {overrideBelowCost && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            Override <strong>{myOverride?.toLocaleString()}</strong> is below
            the variant&apos;s cost basis (
            <strong>{myVariant?.costPrice?.toLocaleString()}</strong>). Each
            sale will lose money — confirm this is intentional.
          </span>
        </div>
      )}

      {myVariantId && (
        <div className="flex items-start gap-1.5 rounded-md bg-card/40 px-3 py-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Inventory tracking (Direct / Recipe / Unlimited) lives on the
            source product variant — manage it from the product edit page.
          </span>
        </div>
      )}
    </div>
  );
}
