"use client";

import React, { useEffect, useState, useTransition } from "react";
import { UUID } from "node:crypto";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
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

/**
 * Per-location customer prepayment configuration. Self-contained — unlike the
 * other settings panels it reads/writes its own Accounts Service endpoint
 * ({@code /api/v1/customer-prepayments/settings}) rather than the shared
 * LocationSettings object.
 */
export function CustomerPrepaymentsPanel({ locationId }: { locationId: string }) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPrepaymentSettings(locationId as UUID)
      .then((s) => {
        if (cancelled) return;
        setForm(
          s
            ? toForm(s)
            : {
                enabled: false,
                allowBusinessWide: false,
                minTopupAmount: 0,
                maxTopupAmount: null,
                defaultExpirationDays: null,
              },
        );
        setDirty(false);
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
    setDirty(true);
  };

  const save = () => {
    if (!form) return;
    startTransition(async () => {
      const result = await updatePrepaymentSettings(locationId as UUID, form);
      if (result.responseType === "success") {
        if (result.data) setForm(toForm(result.data));
        setDirty(false);
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

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Customer prepayments"
        description="Let customers pay in advance and spend the balance on future orders. Funds are a liability the business owes them until used."
      />

      <SettingsSection
        title="Prepayments"
        description="Enable prepaid balances and set the limits for top-ups taken at this location."
        onSave={save}
        isPending={isPending}
        isDirty={dirty}
      >
        <SettingsSwitchRow
          label="Enable customer prepayments"
          description="Allow staff to record top-ups and customers to pay with prepaid balance."
          checked={form.enabled}
          onChange={(x) => setField("enabled", x)}
          disabled={isPending}
        />

        {form.enabled && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Minimum top-up">
                <Input
                  type="number"
                  min={0}
                  value={form.minTopupAmount ?? ""}
                  onChange={(e) =>
                    setField(
                      "minTopupAmount",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
              <Field label="Maximum top-up (blank = no limit)">
                <Input
                  type="number"
                  min={0}
                  value={form.maxTopupAmount ?? ""}
                  onChange={(e) =>
                    setField(
                      "maxTopupAmount",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
              <Field label="Default expiry (days, blank = never)">
                <Input
                  type="number"
                  min={1}
                  value={form.defaultExpirationDays ?? ""}
                  onChange={(e) =>
                    setField(
                      "defaultExpirationDays",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
            </div>

            <SettingsSwitchRow
              label="Allow business-wide credit"
              description="When on, prepaid balance funded here can be spent at any location of the business. Otherwise it is limited to this location."
              checked={form.allowBusinessWide}
              onChange={(x) => setField("allowBusinessWide", x)}
              disabled={isPending}
            />
          </>
        )}
      </SettingsSection>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
