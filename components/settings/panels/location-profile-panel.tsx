"use client";

import { useMemo, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  SettingsSection,
  SettingsSwitchRow,
} from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type {
  LocationSettings,
  OperatingHours,
  DayOfWeek,
} from "@/types/location-settings/type";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/types/location-settings/type";
import { updateLocationSettings } from "@/lib/actions/location-settings-actions";

const PROFILE_KEYS = [
  "currency",
  "minimumOrderAmount",
  "maxDiscountPercentage",
  "discountApprovalThreshold",
] as const;

interface Props {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}

export function LocationProfilePanel({ settings, onSaved }: Props) {
  const panel = useSettingsPanel(PROFILE_KEYS, settings, onSaved);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Currency & pricing"
        description="Base currency and guard-rails that apply across POS, receipts, and reports."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledField label="Currency" hint="3-letter ISO code (e.g. TZS, USD).">
            <Input
              maxLength={3}
              value={panel.values.currency ?? ""}
              onChange={(e) =>
                panel.setField("currency", e.target.value.toUpperCase())
              }
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField label="Minimum order amount">
            <Input
              type="number"
              min={0}
              value={panel.values.minimumOrderAmount ?? ""}
              onChange={(e) =>
                panel.setField(
                  "minimumOrderAmount",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField
            label="Max discount (%)"
            hint="Hard ceiling — any attempt above this is blocked."
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={panel.values.maxDiscountPercentage ?? ""}
              onChange={(e) =>
                panel.setField(
                  "maxDiscountPercentage",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
          <LabeledField
            label="Discount approval (%)"
            hint="Above this %, the discount needs manager approval."
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={panel.values.discountApprovalThreshold ?? ""}
              onChange={(e) =>
                panel.setField(
                  "discountApprovalThreshold",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </LabeledField>
        </div>
      </SettingsSection>

      <OperatingHoursCard settings={settings} onSaved={onSaved} />
    </div>
  );
}

function OperatingHoursCard({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const seed = useMemo<OperatingHours[]>(() => {
    const byDay = new Map<DayOfWeek, OperatingHours>();
    for (const h of settings.operatingHours ?? []) byDay.set(h.dayOfWeek, h);
    return DAYS_OF_WEEK.map(
      (d) =>
        byDay.get(d) ?? {
          dayOfWeek: d,
          openTime: "08:00",
          closeTime: "22:00",
          closed: false,
        },
    );
  }, [settings.operatingHours]);

  const [hours, setHours] = useState<OperatingHours[]>(seed);
  const [baseline, setBaseline] = useState<OperatingHours[]>(seed);

  const isDirty = JSON.stringify(hours) !== JSON.stringify(baseline);

  const update = (day: DayOfWeek, patch: Partial<OperatingHours>) =>
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === day ? { ...h, ...patch } : h)),
    );

  const save = () =>
    startTransition(async () => {
      const res = await updateLocationSettings({ operatingHours: hours });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save operating hours",
          description: res.message,
        });
        return;
      }
      toast({ title: "Saved", description: res.message });
      if (res.data) {
        setBaseline(hours);
        onSaved(res.data);
      }
    });

  return (
    <SettingsSection
      title="Operating hours"
      description="Used for day-session auto roll-over and reservations availability."
      onSave={save}
      isDirty={isDirty}
      isPending={isPending}
    >
      <div className="space-y-2">
        {hours.map((h) => (
          <div
            key={h.dayOfWeek}
            className="grid grid-cols-12 items-center gap-3 py-1.5 border-b last:border-b-0"
          >
            <span className="col-span-3 text-sm font-medium">
              {DAY_LABELS[h.dayOfWeek]}
            </span>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                checked={!h.closed}
                onCheckedChange={(v) => update(h.dayOfWeek, { closed: !v })}
                disabled={isPending}
              />
              <span className="text-xs text-muted-foreground">
                {h.closed ? "Closed" : "Open"}
              </span>
            </div>
            <div className="col-span-3">
              <Input
                type="time"
                value={h.openTime ?? ""}
                onChange={(e) => update(h.dayOfWeek, { openTime: e.target.value })}
                disabled={isPending || h.closed}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="time"
                value={h.closeTime ?? ""}
                onChange={(e) => update(h.dayOfWeek, { closeTime: e.target.value })}
                disabled={isPending || h.closed}
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Ensure tree-shaken helper stays imported for future panels
void SettingsSwitchRow;
void Button;
void Loader2;
