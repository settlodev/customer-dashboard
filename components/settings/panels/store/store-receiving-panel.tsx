"use client";

import { Clock, PackageCheck } from "lucide-react";

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
  "requireQualityCheck",
  "requireReceivingPhotos",
  "autoReceiveAfterHours",
] as const;

export function StoreReceivingPanel({
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
        title="Receiving"
        description="What has to happen before goods arriving at this store count as received."
      />

      <SettingsSection
        icon={<PackageCheck className="h-4 w-4" />}
        title="Receiving checks"
        description="Evidence and sign-off required on arrival."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Require quality check"
            hint="Hold incoming goods on inspection until someone signs them off."
            checked={!!v.requireQualityCheck}
            onChange={(x) => p.setField("requireQualityCheck", x)}
            disabled={d}
          />
          <ToggleRow
            label="Require receiving photos"
            hint="Capture a photo of the delivery before it can be marked received."
            checked={!!v.requireReceivingPhotos}
            onChange={(x) => p.setField("requireReceivingPhotos", x)}
            disabled={d}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Auto-receive after"
            hint="Mark a pending delivery received after this long. Blank means manual only."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="hours"
                prefix={<Clock className="h-3.5 w-3.5" />}
                value={v.autoReceiveAfterHours ?? ""}
                onChange={(e) =>
                  p.setField("autoReceiveAfterHours", parseOptionalNumber(e.target.value))
                }
                placeholder="Manual only"
                disabled={d}
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
