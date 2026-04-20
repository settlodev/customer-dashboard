"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { NumericFormat } from "react-number-format";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { Money } from "@/components/widgets/money";
import {
  createSupplierPricing,
  deleteSupplierPricing,
  updateSupplierPricing,
} from "@/lib/actions/supplier-pricing-actions";
import {
  SupplierPricingSchema,
  type SupplierPricing,
  type SupplierPricingPayload,
} from "@/types/supplier-pricing/type";

interface Props {
  supplierId: string;
  defaultCurrency: string;
  pricing: SupplierPricing[];
}

/**
 * Pricing table + inline add/edit/delete dialogs for a supplier. Backed by
 * `/api/v1/supplier-pricing` which is business-scoped — so the list lives
 * entirely on the supplier detail page.
 */
export function SupplierPricingPanel({ supplierId, defaultCurrency, pricing }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierPricing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupplierPricing | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: SupplierPricing) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const res = await deleteSupplierPricing(confirmDelete.id, supplierId);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Removed", description: res.message });
        setConfirmDelete(null);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Price list</h3>
            <p className="text-xs text-muted-foreground">
              Agreed unit prices, MOQs, lead time, and payment terms. Used by
              auto-reorder when this supplier is preferred.
            </p>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add price
          </Button>
        </div>

        {pricing.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No negotiated prices yet for this supplier.
          </p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Lead time</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium">
                      {row.stockVariantName || row.stockName || row.stockVariantId}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <Money amount={row.unitPrice} currency={row.currency} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {row.minOrderQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {row.leadTimeDays}d
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                      {row.paymentTerms || "\u2014"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.validFrom || row.validTo
                        ? `${row.validFrom ?? "—"} → ${row.validTo ?? "open"}`
                        : "Always"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-600"
                          onClick={() => setConfirmDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <PricingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplierId={supplierId}
        defaultCurrency={defaultCurrency}
        editing={editing}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove price?</DialogTitle>
            <DialogDescription>
              Deletes the negotiated price for{" "}
              <strong>
                {confirmDelete?.stockVariantName || confirmDelete?.stockVariantId}
              </strong>{" "}
              with this supplier. Future auto-reorders will fall back to the
              stock average cost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PricingDialog({
  open,
  onOpenChange,
  supplierId,
  defaultCurrency,
  editing,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  supplierId: string;
  defaultCurrency: string;
  editing: SupplierPricing | null;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SupplierPricingPayload>({
    resolver: zodResolver(SupplierPricingSchema),
    values: {
      supplierId,
      stockVariantId: editing?.stockVariantId ?? "",
      unitPrice: editing?.unitPrice ?? 0,
      currency: editing?.currency ?? defaultCurrency ?? "TZS",
      minOrderQuantity: editing?.minOrderQuantity ?? 1,
      leadTimeDays: editing?.leadTimeDays ?? 7,
      paymentTerms: editing?.paymentTerms ?? "",
      validFrom: editing?.validFrom ?? "",
      validTo: editing?.validTo ?? "",
      notes: editing?.notes ?? "",
    },
  });

  const submit = (values: SupplierPricingPayload) => {
    startTransition(async () => {
      const res = editing
        ? await updateSupplierPricing(editing.id, values)
        : await createSupplierPricing(values);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Saved", description: res.message });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Update price" : "Add supplier price"}</DialogTitle>
          <DialogDescription>
            Pricing is scoped to this supplier and variant. Leave validity blank
            for an always-on price.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stockVariantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock variant</FormLabel>
                  <FormControl>
                    <StockVariantSelector
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      isDisabled={isPending || !!editing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit price</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v.value === "" ? 0 : Number(v.value))
                        }
                        thousandSeparator
                        decimalScale={6}
                        allowNegative={false}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <CurrencySelector
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        isDisabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum order qty</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v.value === "" ? 0 : Number(v.value))
                        }
                        thousandSeparator
                        decimalScale={6}
                        allowNegative={false}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead time (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Math.max(0, Number(e.target.value) || 0))
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
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid from</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid to</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment terms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Net 30, COD"
                      {...field}
                      value={field.value ?? ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
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

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Update" : "Add price"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
