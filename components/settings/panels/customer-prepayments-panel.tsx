"use client";

import { useEffect, useState, useTransition } from "react";
import { UUID } from "node:crypto";
import { CalendarClock, Coins, Loader2, Wallet } from "lucide-react";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import { PanelHeader } from "../shared/panel-header";
import { useToast } from "@/hooks/use-toast";
import {
  getPrepaymentSettings,
  updatePrepaymentSettings,
} from "@/lib/actions/customer-prepayments-actions";
import type { PrepaymentSettings } from "@/types/customer-prepayments/type";

interface FormState {
  enabled: boolean;
  allowBusinessWide: boolean;
  minTopupAmount: number;
  maxTopupAmount: number | null;
  defaultExpirationDays: number | null;
}

const toForm = (s: PrepaymentSettings): FormState => ({
  enabled: s.enabled,
  allowBusinessWide: s.allowBusinessWide,
  minTopupAmount: s.minTopupAmount ?? 0,
  maxTopupAmount: s.maxTopupAmount,
  defaultExpirationDays: s.defaultExpirationDays,
});

const ICON = "h-3.5 w-3.5";

/**
 * Per-location customer prepayment configuration. Self-contained — unlike the
 * other settings panels it reads/writes its own Accounts Service endpoint
 * ({@code /api/v1/customer-prepayments/settings}) rather than the shared
 * LocationSettings object.
 */
export function CustomerPrepaymentsPanel({
  locationId,
  currency,
}: {
  locationId: string;
  /** Shown as the unit on the top-up amounts. */
  currency?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [baseline, setBaseline] = useState<FormState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPrepaymentSettings(locationId as UUID)
      .then((s) => {
        if (cancelled) return;
        const next =
          s
            ? toForm(s)
            : {
                enabled: false,
                allowBusinessWide: false,
                minTopupAmount: 0,
                maxTopupAmount: null,
                defaultExpirationDays: null,
              };
        setForm(next);
        setBaseline(next);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // Count the fields that actually moved so the save bar reads like the rest.
  const dirtyCount =
    form && baseline
      ? (Object.keys(form) as (keyof FormState)[]).filter(
          (k) => (form[k] ?? null) !== (baseline[k] ?? null),
        ).length
      : 0;

  const save = () => {
    if (!form) return;
    startTransition(async () => {
      const result = await updatePrepaymentSettings(locationId as UUID, form);
      if (result.responseType === "success") {
        const next = result.data ? toForm(result.data) : form;
        setForm(next);
        setBaseline(next);
        toast({ title: "Prepayment settings saved" });
      } else {
        toast({
          title: "Could not save settings",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading prepayment settings…
      </div>
    );
  }

  const d = isPending;
  const off = !form.enabled;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Customer prepayments"
        description="Let customers pay in advance and spend the balance on future orders. Funds are a liability the business owes them until used."
      />

      <SettingsSection
        icon={<Wallet className="h-4 w-4" />}
        title="Prepayments"
        description="Enable prepaid balances and set the limits for top-ups taken at this location."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Customer prepayments"
            hint="Staff can record top-ups and customers can pay from their balance."
            checked={form.enabled}
            onChange={(x) => setField("enabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Business-wide credit"
            hint="Balance funded here can be spent at any location. Off keeps it to this location."
            checked={form.allowBusinessWide}
            onChange={(x) => setField("allowBusinessWide", x)}
            disabled={d || off}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Minimum top-up" hint="Smallest amount staff may take.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={currency || undefined}
                prefix={<Coins className={ICON} />}
                value={form.minTopupAmount ?? ""}
                onChange={(e) =>
                  setField("minTopupAmount", parseOptionalNumber(e.target.value) ?? 0)
                }
                placeholder="0"
                disabled={d || off}
              />
            )}
          </Field>
          <Field label="Maximum top-up" hint="Leave blank for no ceiling.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={currency || undefined}
                prefix={<Coins className={ICON} />}
                value={form.maxTopupAmount ?? ""}
                onChange={(e) =>
                  setField("maxTopupAmount", parseOptionalNumber(e.target.value))
                }
                placeholder="No limit"
                disabled={d || off}
              />
            )}
          </Field>
          <Field label="Default expiry" hint="Leave blank and balances never expire.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="days"
                prefix={<CalendarClock className={ICON} />}
                value={form.defaultExpirationDays ?? ""}
                onChange={(e) =>
                  setField("defaultExpirationDays", parseOptionalNumber(e.target.value))
                }
                placeholder="Never"
                disabled={d || off}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={dirtyCount}
        isPending={isPending}
        onSave={save}
        onDiscard={() => baseline && setForm(baseline)}
      />
    </div>
  );
}
