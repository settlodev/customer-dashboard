"use client";

import { Input } from "@/components/ui/input";
import {
  SettingsSection,
  SettingsSwitchRow,
  SettingsField,
} from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import type { StoreSettings } from "@/types/store/type";

const KEYS = [
  "enableCycleCounting",
  "cycleCountIntervalDays",
  "requireAdjustmentApproval",
  "adjustmentApprovalThreshold",
] as const;

export function StoreCountingPanel({
  settings,
  storeId,
  onSaved,
}: {
  settings: StoreSettings;
  storeId: string;
  onSaved: (next: StoreSettings) => void;
}) {
  const p = useStoreSettingsPanel(KEYS, settings, storeId, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Counting & audit"
        description="How often this store is counted, and who signs off when the count disagrees with the system."
      />

      <SettingsSection
        title="Cycle counting"
        description="Rolling counts instead of one big stock take."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Enable cycle counting"
          checked={!!v.enableCycleCounting}
          onChange={(x) => p.setField("enableCycleCounting", x)}
          disabled={p.isPending}
        />
        {v.enableCycleCounting && (
          <SettingsField
            label="Days between counts"
            hint="How often each item comes back around to be counted."
          >
            <Input
              type="number"
              min={1}
              value={v.cycleCountIntervalDays ?? ""}
              onChange={(e) =>
                p.setField(
                  "cycleCountIntervalDays",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </SettingsField>
        )}
      </SettingsSection>

      <SettingsSection
        title="Adjustment approvals"
        description="Guard rails on writing stock up or down at this store."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Require approval for adjustments"
          description="A manager must sign off before an inventory adjustment is posted."
          checked={!!v.requireAdjustmentApproval}
          onChange={(x) => p.setField("requireAdjustmentApproval", x)}
          disabled={p.isPending}
        />
        <SettingsField
          label="Variance that triggers approval (%)"
          hint="Adjustments beyond this percentage of the counted balance need sign-off. Leave empty to require it for all."
        >
          <Input
            type="number"
            min={0}
            max={100}
            value={v.adjustmentApprovalThreshold ?? ""}
            onChange={(e) =>
              p.setField(
                "adjustmentApprovalThreshold",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            disabled={p.isPending}
          />
        </SettingsField>
      </SettingsSection>
    </div>
  );
}
