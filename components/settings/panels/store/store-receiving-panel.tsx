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

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Receiving"
        description="What has to happen before goods arriving at this store count as received."
      />

      <SettingsSection
        title="Receiving checks"
        description="Evidence and sign-off required on arrival."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Require quality check"
          description="Hold incoming goods on inspection until someone signs them off."
          checked={!!v.requireQualityCheck}
          onChange={(x) => p.setField("requireQualityCheck", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Require receiving photos"
          description="Capture a photo of the delivery before it can be marked received."
          checked={!!v.requireReceivingPhotos}
          onChange={(x) => p.setField("requireReceivingPhotos", x)}
          disabled={p.isPending}
        />
        <SettingsField
          label="Auto-receive after (hours)"
          hint="Automatically mark a pending delivery received after this long. Leave empty for manual receiving only."
        >
          <Input
            type="number"
            min={1}
            value={v.autoReceiveAfterHours ?? ""}
            onChange={(e) =>
              p.setField(
                "autoReceiveAfterHours",
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
