"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SlidersHorizontal, AlertTriangle, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import SupplierSelector from "@/components/widgets/supplier-selector";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import {
  setLowStockThreshold,
  setOverstockThreshold,
  setReorderConfig,
} from "@/lib/actions/inventory-balance-actions";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

const FormSchema = z
  .object({
    reorderPoint: z.preprocess(
      toNumber,
      z.number().nonnegative("Cannot be negative").optional(),
    ),
    reorderQuantity: z.preprocess(
      toNumber,
      z.number().positive("Must be greater than zero").optional(),
    ),
    preferredSupplierId: z.string().uuid().optional().or(z.literal("")),
    lowStockThreshold: z.preprocess(
      toNumber,
      z.number().nonnegative("Cannot be negative").optional(),
    ),
    overstockThreshold: z.preprocess(
      toNumber,
      z.number().nonnegative("Cannot be negative").optional(),
    ),
  })
  .superRefine((val, ctx) => {
    if (
      val.lowStockThreshold != null &&
      val.overstockThreshold != null &&
      val.overstockThreshold < val.lowStockThreshold
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["overstockThreshold"],
        message: "Overstock must be greater than low-stock threshold",
      });
    }
    if (
      val.reorderPoint != null &&
      val.lowStockThreshold != null &&
      val.reorderPoint < val.lowStockThreshold
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reorderPoint"],
        message: "Reorder point should be at or above the low-stock threshold",
      });
    }
  });

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  locationId: string | null | undefined;
  variantId: string;
  variantName: string;
  unitAbbreviation?: string | null;
  balance: InventoryBalance | null | undefined;
  autoReorderEnabled: boolean;
  /** When true render a compact badge-style trigger that fits inside a table row. */
  compact?: boolean;
}

export function ReorderConfigDialog({
  locationId,
  variantId,
  variantName,
  unitAbbreviation,
  balance,
  autoReorderEnabled,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const initial: FormValues = useMemo(
    () => ({
      reorderPoint: balance?.reorderPoint ?? undefined,
      reorderQuantity: balance?.reorderQuantity ?? undefined,
      preferredSupplierId: balance?.preferredSupplierId ?? "",
      lowStockThreshold: balance?.lowStockThreshold ?? undefined,
      overstockThreshold: balance?.overstockThreshold ?? undefined,
    }),
    [balance],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initial,
    values: initial,
  });

  const hasAnyConfig =
    balance?.reorderPoint != null ||
    balance?.reorderQuantity != null ||
    balance?.preferredSupplierId != null ||
    balance?.lowStockThreshold != null ||
    balance?.overstockThreshold != null;

  const onSubmit = (values: FormValues) => {
    if (!locationId) {
      toast({
        variant: "destructive",
        title: "No location selected",
        description: "Pick a location before editing reorder config.",
      });
      return;
    }

    // Only hit endpoints whose value actually changed — respects backend
    // semantics: setReorderConfig replaces ALL three fields in one write, so
    // we always include the current values.
    const reorderChanged =
      (initial.reorderPoint ?? null) !== (values.reorderPoint ?? null) ||
      (initial.reorderQuantity ?? null) !== (values.reorderQuantity ?? null) ||
      (initial.preferredSupplierId || null) !== (values.preferredSupplierId || null);
    const lowChanged =
      (initial.lowStockThreshold ?? null) !== (values.lowStockThreshold ?? null);
    const overChanged =
      (initial.overstockThreshold ?? null) !== (values.overstockThreshold ?? null);

    if (!reorderChanged && !lowChanged && !overChanged) {
      toast({ title: "No changes" });
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const results: { label: string; ok: boolean; message: string }[] = [];

      if (reorderChanged) {
        const res = await setReorderConfig(locationId, variantId, {
          reorderPoint: values.reorderPoint ?? null,
          reorderQuantity: values.reorderQuantity ?? null,
          preferredSupplierId: values.preferredSupplierId || null,
        });
        results.push({
          label: "Reorder config",
          ok: res.responseType === "success",
          message: res.message,
        });
      }

      if (lowChanged && values.lowStockThreshold != null) {
        const res = await setLowStockThreshold(
          locationId,
          variantId,
          values.lowStockThreshold,
        );
        results.push({
          label: "Low-stock threshold",
          ok: res.responseType === "success",
          message: res.message,
        });
      }

      if (overChanged && values.overstockThreshold != null) {
        const res = await setOverstockThreshold(
          locationId,
          variantId,
          values.overstockThreshold,
        );
        results.push({
          label: "Overstock threshold",
          ok: res.responseType === "success",
          message: res.message,
        });
      }

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        toast({
          title: "Reorder settings saved",
          description: `${results.length} update${results.length === 1 ? "" : "s"} applied.`,
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: `${failed.length} update${failed.length === 1 ? "" : "s"} failed`,
          description: failed.map((f) => `${f.label}: ${f.message}`).join(" · "),
        });
      }
    });
  };

  const trigger = compact ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs gap-1"
    >
      <SlidersHorizontal className="h-3 w-3" />
      {hasAnyConfig ? "Edit" : "Set"}
    </Button>
  ) : (
    <Button type="button" variant="outline" size="sm">
      <SlidersHorizontal className="h-4 w-4 mr-1.5" />
      {hasAnyConfig ? "Edit reorder config" : "Set reorder config"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reorder config · {variantName}</DialogTitle>
          <DialogDescription>
            When on-hand drops below the reorder point, the system can
            auto-generate a Draft LPO for the preferred supplier using the
            reorder quantity. Thresholds also drive low-stock and overstock
            alerts.
          </DialogDescription>
        </DialogHeader>

        {!autoReorderEnabled && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Auto-reorder is off for this location, so values below drive
              alerts only — no LPOs will be generated automatically. Enable
              <code className="mx-1">autoReorderEnabled</code>
              in location settings to switch that on.
            </span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder point</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value ?? ""}
                        onValueChange={(v) =>
                          field.onChange(v.value === "" ? undefined : Number(v.value))
                        }
                        thousandSeparator
                        decimalScale={6}
                        allowNegative={false}
                        placeholder="e.g. 20"
                        disabled={isPending}
                        suffix={unitAbbreviation ? ` ${unitAbbreviation}` : undefined}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Fires an LPO when available qty ≤ this.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder quantity</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value ?? ""}
                        onValueChange={(v) =>
                          field.onChange(v.value === "" ? undefined : Number(v.value))
                        }
                        thousandSeparator
                        decimalScale={6}
                        allowNegative={false}
                        placeholder="e.g. 100"
                        disabled={isPending}
                        suffix={unitAbbreviation ? ` ${unitAbbreviation}` : undefined}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      How much the generated LPO orders.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredSupplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred supplier</FormLabel>
                  <FormControl>
                    <SupplierSelector
                      label="Preferred supplier"
                      placeholder="Select supplier for auto-orders"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={() => {}}
                      isDisabled={isPending}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    The Draft LPO is created for this supplier. Source list
                    preferences override this when no preferred supplier is set.
                  </p>
                </FormItem>
              )}
            />

            <div className="border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                Alert thresholds
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low-stock threshold</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v.value === "" ? undefined : Number(v.value))
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          placeholder="e.g. 10"
                          disabled={isPending}
                          suffix={unitAbbreviation ? ` ${unitAbbreviation}` : undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overstockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overstock threshold</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v.value === "" ? undefined : Number(v.value))
                          }
                          thousandSeparator
                          decimalScale={6}
                          allowNegative={false}
                          placeholder="e.g. 500"
                          disabled={isPending}
                          suffix={unitAbbreviation ? ` ${unitAbbreviation}` : undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small summary chip showing current reorder settings — pairs with the dialog
 * trigger inside a table row to give operators a quick "is anything set?" read.
 */
export function ReorderConfigSummary({
  balance,
  unitAbbreviation,
}: {
  balance: InventoryBalance | null | undefined;
  unitAbbreviation?: string | null;
}) {
  if (!balance) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const pieces: string[] = [];
  if (balance.reorderPoint != null) {
    pieces.push(
      `↻ ${balance.reorderPoint.toLocaleString()}${unitAbbreviation ? ` ${unitAbbreviation}` : ""}`,
    );
  }
  if (balance.reorderQuantity != null) {
    pieces.push(`+${balance.reorderQuantity.toLocaleString()}`);
  }
  if (balance.lowStockThreshold != null) {
    pieces.push(`low ≤ ${balance.lowStockThreshold.toLocaleString()}`);
  }
  if (balance.overstockThreshold != null) {
    pieces.push(`over ≥ ${balance.overstockThreshold.toLocaleString()}`);
  }
  if (pieces.length === 0) {
    return <span className="text-xs text-muted-foreground italic">not set</span>;
  }
  return (
    <span className="text-xs text-gray-700 whitespace-nowrap">
      {pieces.join(" · ")}
    </span>
  );
}
