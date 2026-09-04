"use client";

import { CalendarClock, ClipboardCheck, Percent, ShieldCheck } from "lucide-react";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import { SettingsSaveBar } from "../../shared/settings-save-bar";
import type { StoreSettings } from "@/types/store/type";

const KEYS = [
  "enableCycleCounting",
  "cycleCountIntervalDays",
  "requireAdjustmentApproval",
  "adjustmentApprovalThreshold",
] as const;

const ICON = "h-3.5 w-3.5";

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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Counting & audit"
        description="How often this store is counted, and who signs off when the count disagrees with the system."
      />

      <SettingsSection
        icon={<ClipboardCheck className="h-4 w-4" />}
        title="Cycle counting"
        description="Rolling counts instead of one big stock take."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Cycle counting"
            hint="Count a slice of the store on a schedule without closing."
            checked={!!v.enableCycleCounting}
            onChange={(x) => p.setField("enableCycleCounting", x)}
            disabled={d}
            className="sm:col-span-1 lg:col-span-2"
          />
          <Field
            label="Days between counts"
            hint="How often each item comes back around."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="days"
                prefix={<CalendarClock className={ICON} />}
                value={v.cycleCountIntervalDays ?? ""}
                onChange={(e) =>
                  p.setField("cycleCountIntervalDays", parseOptionalNumber(e.target.value))
                }
                placeholder="30"
                disabled={d || !v.enableCycleCounting}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Adjustment approvals"
        description="Guard rails on writing stock up or down at this store."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Require approval for adjustments"
            hint="A manager must sign off before an adjustment is posted."
            checked={!!v.requireAdjustmentApproval}
            onChange={(x) => p.setField("requireAdjustmentApproval", x)}
            disabled={d}
            className="sm:col-span-1 lg:col-span-2"
          />
          <Field
            label="Variance that needs sign-off"
            hint="Blank requires approval for every adjustment."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                max={100}
                suffix="%"
                prefix={<Percent className={ICON} />}
                value={v.adjustmentApprovalThreshold ?? ""}
                onChange={(e) =>
                  p.setField(
                    "adjustmentApprovalThreshold",
                    parseOptionalNumber(e.target.value),
                  )
                }
                placeholder="All"
                disabled={d || !v.requireAdjustmentApproval}
              />
            )}
          </Field>
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
