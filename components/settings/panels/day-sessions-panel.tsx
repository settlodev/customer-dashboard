"use client";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "enableDaySessions",
  "autoOpenDay",
  "autoCloseDay",
  "autoCloseBusinessDays",
  "minimumSettlementAmount",
] as const;

export function DaySessionsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Day sessions"
        description="Group orders, cash movements, and staff activity into a discrete business day."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Enable day sessions"
          description="Turn on to require staff to open and close the day."
          checked={!!v.enableDaySessions}
          onChange={(x) => p.setField("enableDaySessions", x)}
          disabled={p.isPending}
        />
        {v.enableDaySessions && (
          <>
            <SettingsSwitchRow
              label="Auto-open day"
              description="Open the day automatically at the start of operating hours."
              checked={!!v.autoOpenDay}
              onChange={(x) => p.setField("autoOpenDay", x)}
              disabled={p.isPending}
            />
            <SettingsSwitchRow
              label="Auto-close day"
              description="Close the day automatically at the end of operating hours."
              checked={!!v.autoCloseDay}
              onChange={(x) => p.setField("autoCloseDay", x)}
              disabled={p.isPending}
            />
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="Settlement & payout"
        description="Settings used when rolling day takings into settlement / payout."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Auto-close business days"
          description="Lock the day at the operating-hour cutoff regardless of staff action."
          checked={!!v.autoCloseBusinessDays}
          onChange={(x) => p.setField("autoCloseBusinessDays", x)}
          disabled={p.isPending}
        />
        <Field label="Minimum settlement amount">
          <Input
            type="number"
            min={0}
            value={v.minimumSettlementAmount ?? ""}
            onChange={(e) =>
              p.setField(
                "minimumSettlementAmount",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            disabled={p.isPending}
          />
        </Field>
      </SettingsSection>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
