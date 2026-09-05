"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Globe,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ControlBox,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  ToggleRow,
  controlInputClass,
} from "@/components/ui/field";
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
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  deleteManualExchangeRate,
  fetchCurrentExchangeRates,
  fetchManualExchangeRates,
  setManualExchangeRate,
} from "@/lib/actions/exchange-rate-actions";
import {
  SetManualRateSchema,
  type ManualExchangeRate,
  type SetManualRatePayload,
  type SystemExchangeRate,
} from "@/types/exchange-rate/type";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSection } from "../shared/settings-section";
import { ConfirmDeleteButton } from "../shared/confirm-delete-button";
import {
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
import CurrencySelector from "@/components/widgets/currency-selector";

const ICON = "h-3.5 w-3.5";

/**
 * Panel for the location settings page. Lets operators set manual
 * exchange-rate overrides on top of the daily system rates from Accounts.
 * Location-scoped toggle anchors the new rate to the current location;
 * otherwise it applies business-wide.
 */
export function ExchangeRatesPanel({ base = "TZS" }: { base?: string }) {
  const [rates, setRates] = useState<ManualExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemRates, setSystemRates] = useState<SystemExchangeRate[]>([]);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const reload = () => {
    setIsLoading(true);
    fetchManualExchangeRates()
      .then(setRates)
      .finally(() => setIsLoading(false));
  };

  const reloadSystem = () => {
    setIsLoadingSystem(true);
    fetchCurrentExchangeRates(base)
      .then(setSystemRates)
      .finally(() => setIsLoadingSystem(false));
  };

  useEffect(() => {
    reload();
    reloadSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const onDelete = (rate: ManualExchangeRate) => {
    startTransition(async () => {
      const res = await deleteManualExchangeRate(rate.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Removed", description: res.message });
        reload();
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Exchange rates"
        description={`Current system rates against ${base.toUpperCase()}, plus any manual overrides you've set.`}
      />

      <CurrentRatesCard
        base={base}
        rates={systemRates}
        isLoading={isLoadingSystem}
        onRefresh={reloadSystem}
      />

      <SettingsSection
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title="Manual overrides"
        description="Location-scoped rates take priority; business-scoped rates apply when no location override exists. An override replaces the daily system rate for its pair."
        footer={
          <>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              disabled={isPending}
            >
              <Plus className={ICON} /> Add rate
            </Button>
            <ManualRateDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSaved={reload}
            />
          </>
        }
      >
        <SettingsTableCard
          loading={isLoading}
          isEmpty={rates.length === 0}
          emptyLabel="No manual rate overrides. Lookups fall through to the daily system rate automatically."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Pair</th>
                <th className={`${thClass} text-right`}>Rate</th>
                <th className={`${thClass} text-right`}>Inverse</th>
                <th className={thClass}>Scope</th>
                <th className={thClass}>Effective</th>
                <th className={thClass}>Notes</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className={trClass}>
                  <td className={`${tdClass} whitespace-nowrap font-mono text-[12px]`}>
                    {r.sourceCurrency}
                    <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                    {r.targetCurrency}
                  </td>
                  <td className={`${tdClass} text-right font-mono font-medium tabular-nums`}>
                    {Number(r.rate).toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className={`${tdClass} text-right font-mono tabular-nums text-ink-3`}>
                    {Number(r.inverseRate).toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className={tdClass}>
                    {r.scope === "LOCATION" ? (
                      <Badge variant="pos" className="font-normal">
                        <MapPin className="h-3 w-3" /> Location
                      </Badge>
                    ) : (
                      <Badge variant="soft" className="font-normal">
                        <Building2 className="h-3 w-3" /> Business
                      </Badge>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-ink-3`}>
                    {r.effectiveDate}
                  </td>
                  <td className={`${tdClass} max-w-[180px] truncate text-ink-3`}>
                    {r.notes || "—"}
                  </td>
                  <td className={tdActionsClass}>
                    <ConfirmDeleteButton
                      disabled={isPending}
                      onConfirm={() => onDelete(r)}
                      confirmLabel="Remove override"
                      title={`Remove the ${r.sourceCurrency} → ${r.targetCurrency} override?`}
                      description={`Removes the ${r.scope.toLowerCase()} override. Conversions fall back to the next layer in the rate hierarchy (business → system).`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SettingsTableCard>
      </SettingsSection>
    </div>
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

  // Watched so the rate control can show the pair it converts into.
  const sourceCurrency = form.watch("sourceCurrency");
  const targetCurrency = form.watch("targetCurrency");
  const rate = form.watch("rate");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set manual rate</DialogTitle>
          <DialogDescription>
            Overrides the system rate for this currency pair. Enter the
            multiplier such that{" "}
            <code className="rounded bg-canvas px-1 text-[11px]">
              amount_in_source × rate = amount_in_target
            </code>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceCurrency"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>From</FieldLabel>
                    <FormControl>
                      <CurrencySelector
                        value={field.value}
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
                name="targetCurrency"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>To</FieldLabel>
                    <FormControl>
                      <CurrencySelector
                        value={field.value}
                        onChange={field.onChange}
                        isDisabled={isPending}
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
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel required>Rate</FieldLabel>
                  <FormControl>
                    <ControlBox
                      prefix={<ArrowLeftRight className={ICON} />}
                      suffix={targetCurrency || undefined}
                    >
                      <NumericFormat
                        className={cn(controlInputClass, "font-mono tabular-nums")}
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
                    </ControlBox>
                  </FormControl>
                  {sourceCurrency && targetCurrency && (
                    <FieldHint>
                      Multiplier applied to a {sourceCurrency} amount to get{" "}
                      {targetCurrency}.
                    </FieldHint>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationScoped"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <ToggleRow
                    label="Scope to this location only"
                    hint="Off = applies to every location in the business."
                    checked={!!field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel optional>Notes</FieldLabel>
                  <FormControl>
                    <ControlTextarea
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
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending || !sourceCurrency || !targetCurrency || !rate
                }
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isPending ? "Saving…" : "Save rate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Current rates card — resolved rates (system + your overrides) against
// the location's base currency.
// ──────────────────────────────────────────────────────────────────────

function CurrentRatesCard({
  base,
  rates,
  isLoading,
  onRefresh,
}: {
  base: string;
  rates: SystemExchangeRate[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const baseCode = base.toUpperCase();
  const sorted = [...rates].sort((a, b) =>
    a.sourceCurrency.localeCompare(b.sourceCurrency),
  );
  const freshestFetch = rates.reduce<string | null>(
    (acc, r) => (r.fetchedAt && (!acc || r.fetchedAt > acc) ? r.fetchedAt : acc),
    null,
  );
  const freshestLabel = freshestFetch
    ? new Date(freshestFetch).toLocaleString()
    : null;

  return (
    <SettingsSection
      icon={<Globe className="h-4 w-4" />}
      title={`Current rates · base ${baseCode}`}
      description={`${
        freshestLabel
          ? `Latest system fetch: ${freshestLabel}.`
          : "Daily rates fetched automatically by the platform."
      } A row marked “Override” is a manual rate you or your business has set; otherwise it's the daily system rate.`}
      footer={
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className={ICON} />
          )}
          {isLoading ? "Refreshing…" : "Refresh"}
        </Button>
      }
    >
      <SettingsTableCard
        loading={isLoading && rates.length === 0}
        isEmpty={sorted.length === 0}
        emptyLabel="No rates available yet — the daily fetch hasn't completed."
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Pair</th>
              <th className={`${thClass} text-right`}>Rate</th>
              <th className={`${thClass} text-right`}>Inverse</th>
              <th className={thClass}>Source</th>
              <th className={thClass}>Effective</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.sourceCurrency}-${r.targetCurrency}`} className={trClass}>
                <td className={`${tdClass} whitespace-nowrap font-mono text-[12px]`}>
                  {r.sourceCurrency}
                  <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                  {r.targetCurrency}
                </td>
                <td className={`${tdClass} text-right font-mono font-medium tabular-nums`}>
                  {Number(r.rate).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </td>
                <td className={`${tdClass} text-right font-mono tabular-nums text-ink-3`}>
                  {Number(r.inverseRate).toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  })}
                </td>
                <td className={tdClass}>
                  {r.source === "MANUAL" ? (
                    <Badge variant="pos" className="font-normal">
                      Override
                    </Badge>
                  ) : r.stale ? (
                    <Badge variant="warn" className="font-normal">
                      System · stale
                    </Badge>
                  ) : (
                    <Badge variant="soft" className="font-normal">
                      System
                    </Badge>
                  )}
                </td>
                <td className={`${tdClass} whitespace-nowrap text-ink-3`}>
                  {r.effectiveDate ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsTableCard>
    </SettingsSection>
  );
}
