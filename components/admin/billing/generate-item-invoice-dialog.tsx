"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import {
  generateItemInvoice,
  listAddons,
  listPackages,
} from "@/lib/actions/admin/billing";
import {
  AddonResponse,
  GenerateItemInvoiceRequest,
  PackageResponse,
  SubscriptionItemResponse,
} from "@/types/admin/billing";

interface GenerateItemInvoiceDialogProps {
  businessId: string;
  items: SubscriptionItemResponse[];
  /** entityId -> location/warehouse/store name (billing doesn't own these). */
  entityNames: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function itemLabel(item: SubscriptionItemResponse, entityNames: Record<string, string>): string {
  const name = entityNames[item.entityId];
  const plan = item.packageInfo?.name ?? item.entityType;
  return name ? `${name} · ${plan}` : plan;
}

// Radix's <Select.Item> forbids an empty-string value (it reserves "" to mean
// "cleared, show placeholder"), so "keep current package" needs a real
// sentinel — mapped back to `null` in onSubmit before it reaches the API.
const KEEP_CURRENT = "__keep_current_package__";
// Same sentinel treatment for "no addon" — only one addon can be attached
// per item, so this is a single Select, not a checkbox list.
const NO_ADDON = "__no_addon__";

// The form's own shape, distinct from GenerateItemInvoiceRequest: a Select
// can't carry `null`, so packageId/addonId here are always non-empty
// strings (a sentinel or a real id) until onSubmit translates them.
const ItemInvoiceFormSchema = z.object({
  items: z
    .array(
      z.object({
        subscriptionItemId: z.string().uuid("Pick a subscription item"),
        packageId: z.string().min(1),
        months: z
          .number()
          .int("Months must be a whole number")
          .min(1, "Minimum 1 month")
          .max(36, "Maximum 36 months"),
        addonId: z.string().min(1),
      }),
    )
    .min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof ItemInvoiceFormSchema>;

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function emptyRow() {
  return {
    subscriptionItemId: "",
    packageId: KEEP_CURRENT,
    months: 1,
    addonId: NO_ADDON,
  };
}

export function GenerateItemInvoiceDialog({
  businessId,
  items,
  entityNames,
  open,
  onOpenChange,
  onCreated,
}: GenerateItemInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [packages, setPackages] = useState<PackageResponse[] | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [addons, setAddons] = useState<AddonResponse[] | null>(null);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [addonsError, setAddonsError] = useState<string | null>(null);
  const { toast } = useToast();

  // Mirrors the backend's own reject rules (cancelled / still-in-trial) so a
  // doomed submission never leaves the client — the backend remains the
  // source of truth either way; its error still surfaces via FormError.
  const selectableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status !== "CANCELLED" &&
          !(i.trialEndDate && new Date(i.trialEndDate) > new Date()),
      ),
    [items],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(ItemInvoiceFormSchema),
    defaultValues: { items: [emptyRow()] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  useEffect(() => {
    if (!open) {
      form.reset({ items: [emptyRow()] });
      setError("");
      return;
    }
    let cancelled = false;
    setLoadingPackages(true);
    setPackagesError(null);
    listPackages()
      .then((list) => {
        if (cancelled) return;
        setPackages(list.filter((p) => p.isActive));
      })
      .catch((err: any) => {
        if (cancelled) return;
        setPackagesError(err?.message ?? "Failed to load packages.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false);
      });
    setLoadingAddons(true);
    setAddonsError(null);
    listAddons()
      .then((list) => {
        if (cancelled) return;
        setAddons(list.filter((a) => a.isActive));
      })
      .catch((err: any) => {
        if (cancelled) return;
        setAddonsError(err?.message ?? "Failed to load addons.");
      })
      .finally(() => {
        if (!cancelled) setLoadingAddons(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, form]);

  const onSubmit = (values: FormValues) => {
    setError("");
    const body: GenerateItemInvoiceRequest = {
      items: values.items.map((row) => ({
        subscriptionItemId: row.subscriptionItemId,
        packageId: row.packageId === KEEP_CURRENT ? null : row.packageId,
        months: row.months,
        addonId: row.addonId === NO_ADDON ? null : row.addonId,
      })),
    };
    startTransition(async () => {
      const result = await generateItemInvoice(businessId, body);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: "Invoice created", description: result.message });
      onCreated();
      onOpenChange(false);
    });
  };

  // Every selectable item already picked in some other row can't be picked again.
  const usedItemIds = new Set(watchedItems.map((r) => r.subscriptionItemId).filter(Boolean));
  const allItemsUsed = selectableItems.every((i) => usedItemIds.has(i.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Build custom invoice</DialogTitle>
          <DialogDescription>
            Pick specific subscription items, an optional package for each
            (leave as-is to keep its current package — a package change
            applies going forward, same as Change plan), and how many months
            to bill. Generates one invoice covering exactly this selection.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}
        {packagesError && <FormError message={packagesError} />}
        {addonsError && <FormError message={addonsError} />}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {fields.map((field, index) => {
                const rowItemId = watchedItems[index]?.subscriptionItemId;
                const rowItem = selectableItems.find((i) => i.id === rowItemId) ?? null;
                const eligiblePackages = (packages ?? []).filter(
                  (p) => !rowItem || p.entityType === rowItem.entityType,
                );
                const selectedPackage =
                  eligiblePackages.find((p) => p.id === watchedItems[index]?.packageId) ?? null;
                const itemOptions = selectableItems.filter(
                  (i) => i.id === rowItemId || !usedItemIds.has(i.id),
                );
                const eligibleAddons = (addons ?? []).filter(
                  (a) => !rowItem || a.entityType === rowItem.entityType,
                );

                return (
                  <div
                    key={field.id}
                    className="border rounded-lg p-3 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {rowItem
                          ? (entityNames[rowItem.entityId] ?? `Item ${index + 1}`)
                          : `Item ${index + 1}`}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          aria-label={`Remove item ${index + 1}`}
                          disabled={isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.subscriptionItemId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Subscription item</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                f.onChange(value);
                                // Eligible packages/addons are entity-type-specific to the item.
                                form.setValue(`items.${index}.packageId`, KEEP_CURRENT);
                                form.setValue(`items.${index}.addonId`, NO_ADDON);
                              }}
                              value={f.value}
                              disabled={isPending || itemOptions.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pick an item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {itemOptions.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {itemLabel(item, entityNames)} · {item.status}
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
                        name={`items.${index}.packageId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Package</FormLabel>
                            <Select
                              onValueChange={f.onChange}
                              value={f.value}
                              disabled={isPending || loadingPackages || !packages || !rowItem}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingPackages ? "Loading…" : "Keep current"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={KEEP_CURRENT}>
                                  Keep current package
                                </SelectItem>
                                {eligiblePackages.map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.id}>
                                    {pkg.name} · {formatMoney(pkg.basePrice)}
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
                        name={`items.${index}.addonId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Addon</FormLabel>
                            <Select
                              onValueChange={f.onChange}
                              value={f.value}
                              disabled={isPending || loadingAddons || !addons || !rowItem}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingAddons ? "Loading…" : "No addon"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={NO_ADDON}>No addon</SelectItem>
                                {eligibleAddons.map((addon) => (
                                  <SelectItem key={addon.id} value={addon.id}>
                                    {addon.name} · {formatMoney(addon.price)}
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
                        name={`items.${index}.months`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Months</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={36}
                                disabled={isPending}
                                {...f}
                                onChange={(e) => f.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {rowItem?.isBundled && watchedItems[index]?.packageId === KEEP_CURRENT && (
                      <p className="text-[12px] text-muted-foreground">
                        Included in its plan — pick a package to bill it independently.
                      </p>
                    )}
                    {rowItem && selectedPackage && (
                      <p className="text-[12px] text-muted-foreground">
                        {formatMoney(rowItem.packageInfo?.basePrice)} →{" "}
                        {formatMoney(selectedPackage.basePrice)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyRow())}
              disabled={isPending || allItemsUsed}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add item
            </Button>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingPackages}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </span>
                ) : (
                  "Generate invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
