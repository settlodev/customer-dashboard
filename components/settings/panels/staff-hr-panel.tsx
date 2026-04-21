"use client";

import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "enableShiftManagement",
  "enableTimeTracking",
  "enablePerformanceTracking",
] as const;

export function StaffHrPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;

  return (
    <SettingsSection
      title="Staff & HR"
      description="Workforce features for this location."
      onSave={p.save}
      isPending={p.isPending}
      isDirty={p.isDirty}
    >
      <SettingsSwitchRow
        label="Shift management"
        description="Schedule shifts and require staff to claim a shift before serving."
        checked={!!v.enableShiftManagement}
        onChange={(x) => p.setField("enableShiftManagement", x)}
        disabled={p.isPending}
      />
      <SettingsSwitchRow
        label="Time tracking"
        description="Clock-in / clock-out and timesheet capture."
        checked={!!v.enableTimeTracking}
        onChange={(x) => p.setField("enableTimeTracking", x)}
        disabled={p.isPending}
      />
      <SettingsSwitchRow
        label="Performance tracking"
        description="Dashboard metrics for staff sales, average ticket, and tenure."
        checked={!!v.enablePerformanceTracking}
        onChange={(x) => p.setField("enablePerformanceTracking", x)}
        disabled={p.isPending}
      />
    </SettingsSection>
  );
}
