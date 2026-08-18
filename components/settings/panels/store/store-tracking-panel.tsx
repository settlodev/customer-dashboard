"use client";

import {
  SettingsSection,
  SettingsSwitchRow,
} from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import type { StoreSettings } from "@/types/store/type";

const KEYS = [
  "enableBinTracking",
  "enableLotTracking",
  "enableSerialTracking",
] as const;

export function StoreTrackingPanel({
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
        title="Storage & tracking"
        description="How precisely stock is located and identified inside this store."
      />

      <SettingsSection
        title="Tracking granularity"
        description="Each level adds a step when receiving and dispatching — turn on only what you actually record."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Bin tracking"
          description="Record which shelf or bin inside the store an item sits in."
          checked={!!v.enableBinTracking}
          onChange={(x) => p.setField("enableBinTracking", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Lot / batch tracking"
          description="Keep batch identity through receipts, movements and counts."
          checked={!!v.enableLotTracking}
          onChange={(x) => p.setField("enableLotTracking", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Serial number tracking"
          description="Track individual units by serial number."
          checked={!!v.enableSerialTracking}
          onChange={(x) => p.setField("enableSerialTracking", x)}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}
