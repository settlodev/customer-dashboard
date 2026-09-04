"use client";

import { UserCheck } from "lucide-react";

import { ToggleRow } from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Staff & HR"
        description="Workforce features for this location: shifts, time tracking, performance."
      />

      <SettingsSection
        icon={<UserCheck className="h-4 w-4" />}
        title="Workforce features"
        description="Each of these adds a section to the POS and the staff dashboard."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Shift management"
            hint="Schedule shifts and require staff to claim one before serving."
            checked={!!v.enableShiftManagement}
            onChange={(x) => p.setField("enableShiftManagement", x)}
            disabled={d}
          />
          <ToggleRow
            label="Time tracking"
            hint="Clock-in and clock-out with timesheet capture."
            checked={!!v.enableTimeTracking}
            onChange={(x) => p.setField("enableTimeTracking", x)}
            disabled={d}
          />
          <ToggleRow
            label="Performance tracking"
            hint="Dashboard metrics for staff sales, average ticket and tenure."
            checked={!!v.enablePerformanceTracking}
            onChange={(x) => p.setField("enablePerformanceTracking", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={p.dirtyCount}
        isPending={p.isPending}
        onSave={p.save}
        onDiscard={() => p.reset()}
      />
    </div>
  );
}
