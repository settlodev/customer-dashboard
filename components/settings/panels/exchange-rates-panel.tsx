"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  deleteManualExchangeRate,
  fetchManualExchangeRates,
  setManualExchangeRate,
} from "@/lib/actions/exchange-rate-actions";
import {
  SetManualRateSchema,
  type ManualExchangeRate,
  type SetManualRatePayload,
} from "@/types/exchange-rate/type";

/**
 * Panel for the location settings page. Lets operators set manual
 * exchange-rate overrides on top of the daily system rates from Accounts.
 * Location-scoped toggle anchors the new rate to the current location;
 * otherwise it applies business-wide.
 */
export function ExchangeRatesPanel() {
  const [rates, setRates] = useState<ManualExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ManualExchangeRate | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const reload = () => {
    setIsLoading(true);
    fetchManualExchangeRates()
      .then(setRates)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const onDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const res = await deleteManualExchangeRate(confirmDelete.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Removed", description: res.message });
        setConfirmDelete(null);
        reload();
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Exchange rates</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Manual overrides on top of the daily system rates. Location-scoped
            rates take priority; business-scoped rates apply when no location
            override exists. System rates are read-only and not shown here.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={isPending}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add rate
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : rates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No manual rate overrides. Lookups fall through to the daily system
            rate automatically.
          </p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Inverse</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-mono whitespace-nowrap">
                      {r.sourceCurrency}
                      <ArrowRight className="h-3 w-3 inline mx-1 text-muted-foreground" />
                      {r.targetCurrency}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {Number(r.rate).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {Number(r.inverseRate).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          r.scope === "LOCATION"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {r.scope === "LOCATION" ? "Location" : "Business"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {r.effectiveDate}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {r.notes || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:text-red-600"
                        onClick={() => setConfirmDelete(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ManualRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={reload}
      />

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove rate override?</DialogTitle>
            <DialogDescription>
              Removes the{" "}
              <strong>
                {confirmDelete?.sourceCurrency} → {confirmDelete?.targetCurrency}
              </strong>{" "}
              {confirmDelete?.scope.toLowerCase()} override. Conversions fall
              back to the next layer in the rate hierarchy (business → system).
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

function ManualRateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SetManualRatePayload>({
    resolver: zodResolver(SetManualRateSchema),
    defaultValues: {
      sourceCurrency: "USD",
      targetCurrency: "TZS",
      rate: 0,
      locationScoped: true,
      notes: "",
    },
  });

  const submit = (values: SetManualRatePayload) => {
    startTransition(async () => {
      const res = await setManualExchangeRate(values);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Saved", description: res.message });
        onOpenChange(false);
        form.reset({
          sourceCurrency: "USD",
          targetCurrency: "TZS",
          rate: 0,
          locationScoped: true,
          notes: "",
        });
        onSaved();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set manual rate</DialogTitle>
          <DialogDescription>
            Overrides the system rate for this currency pair. Enter the
            multiplier such that{" "}
            <code className="px-1 rounded bg-muted text-[11px]">
              amount_in_source × rate = amount_in_target
            </code>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sourceCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="USD"
                        maxLength={3}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="TZS"
                        maxLength={3}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate</FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v.value === "" ? 0 : Number(v.value))
                      }
                      thousandSeparator
                      decimalScale={8}
                      allowNegative={false}
                      placeholder="e.g. 2500"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationScoped"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-md border p-3">
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                  <div className="space-y-0.5">
                    <FormLabel>Scope to this location only</FormLabel>
                    <p className="text-[11px] text-muted-foreground">
                      Off = applies to every location in the business.
                    </p>
                  </div>
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
                      placeholder="Why this override?"
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
                Save rate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
