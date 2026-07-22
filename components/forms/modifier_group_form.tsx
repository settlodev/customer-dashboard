"use client";

import React, { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Save,
  Trash2,
  Settings2,
  Layers,
  AlertTriangle,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup } from "@/components/ui/radio-group";
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
  FieldHint,
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

import CompatibleUnitSelector from "@/components/widgets/compatible-unit-selector";

import { useToast } from "@/hooks/use-toast";
import type { ModifierGroup } from "@/types/product/type";
import { SELECTION_TYPE_OPTIONS } from "@/types/catalogue/enums";
import {
  ModifierGroupSchema,
  type ModifierGroupInput,
  type ModifierOptionInput,
} from "@/types/product/schema";
import type { FormResponse } from "@/types/types";

import { saveModifierGroupWithOptions } from "@/lib/actions/modifier-actions";

import styles from "./styles/form-shell.module.css";

export interface StockVariantOption {
  id: string;
  label: string;
  /** The stock item's tracking unit — anchors the sale-unit dropdown. */
  unitId: string;
}

interface Props {
  group: ModifierGroup | null;
  stockVariants: StockVariantOption[];
  /**
   * Drawer/dialog mode: invoked with the freshly-created group instead
   * of navigating to /modifier-groups/{id}. The host owns sheet-close
   * and any "now attach to product" follow-up. Only fires on create;
   * the edit path still navigates as before.
   */
  onCreated?: (group: ModifierGroup) => void;
}

const BLANK_OPTION: ModifierOptionInput = {
  name: "",
  priceAdjustment: 0,
  isDefault: false,
  sellabilityMode: "UNLIMITED",
  stockVariantId: undefined,
  directQuantity: undefined,
  saleUnitId: undefined,
  sortOrder: 0,
  active: true,
};

function optionFromExisting(
  o: ModifierGroup["options"][number],
): ModifierOptionInput {
  return {
    id: o.id,
    name: o.name,
    priceAdjustment: o.priceAdjustment,
    isDefault: o.isDefault,
    sellabilityMode: o.sellabilityMode,
    stockVariantId: o.stockVariantId ?? undefined,
    // Prefer the round-tripped typed number; directQuantity is its base-unit
    // equivalent and would show 0.041667 in the box instead of 1.
    directQuantity: o.saleUnitQuantity ?? o.directQuantity ?? undefined,
    saleUnitId: o.saleUnitId ?? undefined,
    sortOrder: o.sortOrder,
    active: o.active,
  };
}

export function ModifierGroupForm({ group, stockVariants, onCreated }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = React.useState<FormResponse | undefined>();

  const isEditing = !!group;
  const isArchived = group?.archivedAt != null;

  const form = useForm<ModifierGroupInput>({
    resolver: zodResolver(ModifierGroupSchema),
    defaultValues: group
      ? {
          id: group.id,
          name: group.name,
          selectionType: group.selectionType,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          sortOrder: group.sortOrder,
          active: group.active,
          options: (group.options ?? []).map(optionFromExisting),
        }
      : {
          name: "",
          selectionType: "SINGLE",
          minSelections: 0,
          maxSelections: 1,
          sortOrder: 0,
          active: true,
          // Pre-load one blank option so the user lands on a fillable
          // editor instead of an empty placeholder + extra click.
          options: [{ ...BLANK_OPTION, sortOrder: 0 }],
        },
  });

  const optionsArray = useFieldArray({
    control: form.control,
    name: "options",
    keyName: "_key",
  });

  // Live snapshot of the selection rules. Drives the conditional Min/Max
  // controls, the auto-promote-default behaviour on add, and the lone-
  // default lock on the option row.
  const selectionType = form.watch("selectionType");
  const minSelections = form.watch("minSelections");
  const maxSelections = form.watch("maxSelections");
  const watchedOptions = form.watch("options") ?? [];
  const isSingle = selectionType === "SINGLE";
  const isSingleRequired = isSingle && (minSelections ?? 0) >= 1;
  const defaultsCount = watchedOptions.filter((o) => o?.isDefault).length;
  const tooManyDefaults =
    defaultsCount > 0 && defaultsCount > (maxSelections ?? 0);

  // Remember the user's last MULTI bounds so flipping SINGLE → MULTI
  // restores something sensible instead of forcing them to retype.
  const lastMultiBounds = useRef<{ min: number; max: number }>({
    min: group?.selectionType === "MULTI" ? group.minSelections : 0,
    max:
      group?.selectionType === "MULTI" && group.maxSelections > 1
        ? group.maxSelections
        : 5,
  });

  // Make sure a SINGLE+required group has exactly one default. Called
  // after any toggle that could leave the group in that mode without
  // one (Required? on, MULTI → SINGLE swap with min=1 carried over).
  const ensureSingleRequiredDefault = () => {
    const opts = form.getValues("options") ?? [];
    if (opts.length === 0) return;
    if (opts.some((o) => o?.isDefault)) return;
    form.setValue(`options.0.isDefault`, true, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSelectionTypeChange = (next: "SINGLE" | "MULTI") => {
    if (next === selectionType) return;
    if (next === "SINGLE") {
      // Stash current MULTI bounds so we can restore them on the way back.
      lastMultiBounds.current = {
        min: minSelections ?? 0,
        max: Math.max(maxSelections ?? 1, 2),
      };
      const clampedMin = Math.min(minSelections ?? 0, 1);
      form.setValue("selectionType", "SINGLE", { shouldValidate: false });
      form.setValue("maxSelections", 1, { shouldValidate: false });
      form.setValue("minSelections", clampedMin, { shouldValidate: true });
      if (clampedMin >= 1) ensureSingleRequiredDefault();
    } else {
      form.setValue("selectionType", "MULTI", { shouldValidate: false });
      form.setValue("maxSelections", lastMultiBounds.current.max, {
        shouldValidate: false,
      });
      form.setValue("minSelections", lastMultiBounds.current.min, {
        shouldValidate: true,
      });
    }
  };

  const handleRequiredToggle = (on: boolean) => {
    form.setValue("minSelections", on ? 1 : 0, { shouldValidate: true });
    if (on) ensureSingleRequiredDefault();
  };

  const handleDiscard = () => {
    router.back();
  };

  const onInvalid = (errors: FieldErrors) => {
    console.warn("Modifier group validation errors", errors);
  };

  const submit = (values: ModifierGroupInput) => {
    setResponse(undefined);
    startTransition(async () => {
      const result = await saveModifierGroupWithOptions(
        group?.id ?? null,
        values,
      );
      if ("responseType" in result && result.responseType === "error") {
        setResponse(result);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      const saved = result as ModifierGroup;
      toast({
        title: isEditing ? "Saved" : "Created",
        description: `${saved.name} ${isEditing ? "updated" : "created"}.`,
      });

      if (onCreated && !isEditing) {
        onCreated(saved);
      } else {
        router.push(`/modifier-groups/${saved.id}`);
      }
    });
  };

  const handleAddOption = () => {
    // In single-required groups the customer must always see something
    // pre-checked, so promote the first added option to default.
    const noDefaultYet = defaultsCount === 0;
    optionsArray.append({
      ...BLANK_OPTION,
      sortOrder: optionsArray.fields.length,
      isDefault: isSingleRequired && noDefaultYet,
    });
  };

  const handleMoveOption = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= optionsArray.fields.length) return;
    optionsArray.move(index, next);
  };

  const handleRemoveOption = (index: number) => {
    const wasDefault = !!form.getValues(`options.${index}.isDefault`);
    optionsArray.remove(index);
    // Removing the default in single-required mode would leave the group
    // with no default — promote whatever option is now first.
    if (
      wasDefault &&
      isSingleRequired &&
      optionsArray.fields.length - 1 > 0
    ) {
      form.setValue(`options.0.isDefault`, true, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
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
                <Settings2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Group details</h3>
                <p className={styles.formCardHeadDesc}>
                  Customer-facing tweaks like milk type, spice level, or extras.
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
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px] sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="min-w-0 space-y-[7px]">
                      <FieldLabel required>Name</FieldLabel>
                      <FormControl>
                        <ControlInput
                          placeholder="e.g. Milk type"
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
                  name="selectionType"
                  render={({ field }) => (
                    <FormItem className="space-y-[7px]">
                      <FieldLabel>Selection</FieldLabel>
                      <Select
                        onValueChange={(v) =>
                          handleSelectionTypeChange(v as "SINGLE" | "MULTI")
                        }
                        value={field.value}
                        disabled={isPending || isArchived}
                      >
                        <FormControl>
                          <SelectTrigger className={controlSelectTriggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SELECTION_TYPE_OPTIONS.map((o) => (
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

                {isSingle ? (
                  // SINGLE collapses Min/Max into one Required? toggle.
                  // Spans the last two grid cells so the row stays 4-wide.
                  <FormField
                    control={form.control}
                    name="minSelections"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 space-y-[7px]">
                        <FieldLabel>Required?</FieldLabel>
                        <div className="flex h-9 items-center gap-3 rounded-md border border-line bg-card px-3">
                          <Switch
                            checked={(field.value ?? 0) >= 1}
                            onCheckedChange={handleRequiredToggle}
                            disabled={isPending || isArchived}
                          />
                          <span className="text-xs text-muted-foreground">
                            {(field.value ?? 0) >= 1
                              ? "Customer must pick one"
                              : "Customer can skip"}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
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
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
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
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isPending || isArchived}
                            />
                          </FormControl>
                          {(maxSelections ?? 0) === 1 && (
                            <FieldHint>
                              Max of 1 — consider switching to Single.
                            </FieldHint>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* Active switch — only on edit. New groups default to
                  active and the toggle lives on the list. */}
              {isEditing && (
                <div className="mt-[15px] grid grid-cols-1 gap-x-[18px] gap-y-[15px]">
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

          {/* ── Options ───────────────────────────────────────────── */}
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Options</h3>
                <p className={styles.formCardHeadDesc}>
                  Choices the customer picks from when this group is attached.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 02</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={isPending || isArchived}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add option
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
                      You&apos;ve pre-selected {defaultsCount} option
                      {defaultsCount === 1 ? "" : "s"} but the group caps at{" "}
                      {maxSelections}. Raise the max or unmark some defaults.
                    </AlertDescription>
                  </AlertBody>
                </Alert>
              )}
              {optionsArray.fields.length === 0 ? (
                <div className={styles.formBodyEmpty}>
                  <p className="h">No options yet</p>
                  <p className="l">
                    Add at least one option so customers have something to pick.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {optionsArray.fields.map((field, index) => (
                    <OptionRow
                      key={field._key}
                      index={index}
                      form={form}
                      stockVariants={stockVariants}
                      disabled={isPending || isArchived}
                      onRemove={() => handleRemoveOption(index)}
                      onMoveUp={() => handleMoveOption(index, -1)}
                      onMoveDown={() => handleMoveOption(index, 1)}
                      isSingle={isSingle}
                      isSingleRequired={isSingleRequired}
                      defaultsCount={defaultsCount}
                      maxSelections={maxSelections ?? 1}
                      totalOptions={optionsArray.fields.length}
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
                        : "This new group and its options will be lost. This cannot be undone."}
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
                isPending || isArchived || optionsArray.fields.length === 0
              }
              title={
                optionsArray.fields.length === 0
                  ? "Add at least one option before saving"
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

interface OptionRowProps {
  index: number;
  form: ReturnType<typeof useForm<ModifierGroupInput>>;
  stockVariants: StockVariantOption[];
  disabled: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSingle: boolean;
  isSingleRequired: boolean;
  defaultsCount: number;
  maxSelections: number;
  totalOptions: number;
}

function OptionRow({
  index,
  form,
  stockVariants,
  disabled,
  onRemove,
  onMoveUp,
  onMoveDown,
  isSingle,
  isSingleRequired,
  defaultsCount,
  maxSelections,
  totalOptions,
}: OptionRowProps) {
  const isDefault = !!form.watch(`options.${index}.isDefault`);
  const isActive = form.watch(`options.${index}.active`) !== false;

  // Single-required groups must always carry exactly one default. When
  // this option is the lone default and no other options exist, the
  // switch is locked on — toggling off would leave the group invalid.
  const isLoneRequiredDefault =
    isSingleRequired && isDefault && totalOptions <= 1;

  // MULTI groups can pre-check up to maxSelections options. Disable the
  // off→on transition once we've hit that ceiling (already-on rows stay
  // editable so the user can swap which ones are default).
  const multiCapHit =
    !isSingle && !isDefault && defaultsCount >= maxSelections;

  // SINGLE flips are mutually exclusive — turning one on clears the
  // others. MULTI just toggles the one row. Either way, marking an
  // inactive option as Default also reactivates it (POS can't
  // pre-check an inactive option).
  const handleDefaultChange = (next: boolean) => {
    if (isSingle && next) {
      const all = form.getValues("options") ?? [];
      all.forEach((_, i) => {
        if (i !== index) {
          form.setValue(`options.${i}.isDefault`, false, {
            shouldDirty: true,
            shouldValidate: false,
          });
        }
      });
    }
    form.setValue(`options.${index}.isDefault`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (next && !isActive) {
      form.setValue(`options.${index}.active`, true, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  };

  // Toggling Active off auto-clears Default so the data layer never
  // carries an inactive+default contradiction (which the POS can't
  // honour anyway).
  const handleActiveChange = (next: boolean) => {
    form.setValue(`options.${index}.active`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!next && isDefault) {
      form.setValue(`options.${index}.isDefault`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-line bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Option {index + 1}
        </span>
        <div className="flex items-center gap-3">
          <FormField
            control={form.control}
            name={`options.${index}.isDefault`}
            render={({ field }) => (
              <FormItem
                className="!mt-0 flex items-center gap-1.5"
                title={
                  isLoneRequiredDefault
                    ? "Add another option to change the default"
                    : multiCapHit
                      ? `Already at ${maxSelections} default${maxSelections === 1 ? "" : "s"}`
                      : undefined
                }
              >
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={handleDefaultChange}
                    disabled={
                      disabled || isLoneRequiredDefault || multiCapHit
                    }
                  />
                </FormControl>
                <FormLabel className="!mt-0 text-xs text-muted-foreground">
                  Default
                </FormLabel>
                {isLoneRequiredDefault && (
                  <Badge
                    variant="soft"
                    className="ml-0.5 px-1.5 py-0 text-[10px] uppercase tracking-wide"
                  >
                    Auto
                  </Badge>
                )}
              </FormItem>
            )}
          />
          <FormItem className="!mt-0 flex items-center gap-1.5">
            <Switch
              checked={isActive}
              onCheckedChange={handleActiveChange}
              disabled={disabled}
            />
            <span className="!mt-0 text-xs text-muted-foreground">Active</span>
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
              disabled={disabled || index === totalOptions - 1}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`options.${index}.name`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel required>Name</FieldLabel>
              <FormControl>
                <ControlInput
                  placeholder="e.g. Oat milk"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`options.${index}.priceAdjustment`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel>Price adjustment</FieldLabel>
              <FormControl>
                <ControlBox>
                  <NumericFormat
                    className={cn(controlInputClass, "tabular-nums")}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v.floatValue ?? 0)}
                    decimalScale={4}
                    thousandSeparator=","
                    disabled={disabled}
                  />
                </ControlBox>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <OptionTracking
        index={index}
        form={form}
        stockVariants={stockVariants}
        disabled={disabled}
      />
    </div>
  );
}

interface OptionTrackingProps {
  index: number;
  form: ReturnType<typeof useForm<ModifierGroupInput>>;
  stockVariants: StockVariantOption[];
  disabled: boolean;
}

function OptionTracking({
  index,
  form,
  stockVariants,
  disabled,
}: OptionTrackingProps) {
  const mode = form.watch(`options.${index}.sellabilityMode`) ?? "UNLIMITED";
  const tracksStock = mode !== "UNLIMITED";

  const stockVariantId = form.watch(`options.${index}.stockVariantId`);
  const anchorUnitId = stockVariants.find((sv) => sv.id === stockVariantId)?.unitId;

  // Re-anchor on stock-item change: the previously-picked unit almost
  // certainly isn't convertible against the new item's tracking unit. This
  // also cleans up saleUnitId when Track stock is toggled off, since that
  // path clears stockVariantId too.
  const previousStockVariantId = useRef(stockVariantId);
  useEffect(() => {
    if (previousStockVariantId.current === stockVariantId) return;
    previousStockVariantId.current = stockVariantId;
    form.setValue(`options.${index}.saleUnitId`, anchorUnitId ?? null, {
      shouldDirty: true,
    });
  }, [stockVariantId, anchorUnitId, form, index]);

  const handleTrackToggle = (next: boolean) => {
    if (next) {
      // Off → On: jump straight into DIRECT (the most common case);
      // user can switch to RECIPE within the section.
      form.setValue(`options.${index}.sellabilityMode`, "DIRECT", {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      // On → Off: clear the link fields so the schema doesn't carry a
      // stale stockVariantId past an UNLIMITED save.
      form.setValue(`options.${index}.sellabilityMode`, "UNLIMITED", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue(`options.${index}.stockVariantId`, undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.setValue(`options.${index}.directQuantity`, undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="rounded-md border border-line bg-card/50">
      <FormItem className="flex items-center justify-between gap-3 p-3">
        <div className="space-y-0.5 min-w-0">
          <FormLabel className="!mt-0 text-sm">Track stock</FormLabel>
          <p className="text-xs text-muted-foreground">
            Deduct inventory each time this option is picked.
          </p>
        </div>
        <Switch
          checked={tracksStock}
          onCheckedChange={handleTrackToggle}
          disabled={disabled}
        />
      </FormItem>

      {tracksStock && (
        <div className="space-y-3 border-t border-line p-3">
          <FormField
            control={form.control}
            name={`options.${index}.sellabilityMode`}
            render={({ field }) => (
              <FormItem className="space-y-[7px]">
                <FieldLabel>How is stock deducted?</FieldLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 gap-2 md:grid-cols-2"
                    disabled={disabled}
                  >
                    <TrackingCard
                      value="DIRECT"
                      current={field.value}
                      title="Direct stock link"
                      description="Deduct a fixed quantity of one stock item per selection."
                      onSelect={() =>
                        field.onChange("DIRECT" as const)
                      }
                    />
                    <TrackingCard
                      value="RECIPE"
                      current={field.value}
                      title="Recipe (BOM)"
                      description="Resolve via a Consumption Rule that can deduct multiple items."
                      onSelect={() =>
                        field.onChange("RECIPE" as const)
                      }
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "DIRECT" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <FormField
                control={form.control}
                name={`options.${index}.stockVariantId`}
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>Stock item</FieldLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger className={controlSelectTriggerClass}>
                          <SelectValue placeholder="Pick a stock item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stockVariants.map((sv) => (
                          <SelectItem key={sv.id} value={sv.id}>
                            {sv.label}
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
                name={`options.${index}.directQuantity`}
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Quantity per selection</FieldLabel>
                    <FormControl>
                      <ControlBox>
                        <NumericFormat
                          className={cn(controlInputClass, "tabular-nums")}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v.floatValue)}
                          decimalScale={6}
                          allowNegative={false}
                          placeholder="e.g. 250"
                          disabled={disabled}
                        />
                      </ControlBox>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`options.${index}.saleUnitId`}
                render={({ field }) => (
                  <FormItem className="space-y-[7px]">
                    <FieldLabel>Unit</FieldLabel>
                    <FormControl>
                      <CompatibleUnitSelector
                        anchorUnitId={anchorUnitId}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Unit"
                        isDisabled={disabled || !anchorUnitId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {mode === "RECIPE" && (
            <div className="flex gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                Recipe-driven. Define which stock items get deducted in{" "}
                <strong>Consumption Rules</strong> after saving the group.
                The rule will key on this option&apos;s id.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrackingCard({
  value,
  current,
  title,
  description,
  onSelect,
}: {
  value: string;
  current: string;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected}
      className="flex w-full items-start gap-2 rounded-md border border-line bg-card p-2.5 text-left transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 hover:border-foreground/20"
    >
      <span
        className="mt-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-line"
        data-selected={selected}
      >
        {selected && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">{title}</div>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}
