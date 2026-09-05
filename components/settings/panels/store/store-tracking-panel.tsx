"use client";

import { ScanLine } from "lucide-react";

import { ToggleRow } from "@/components/ui/field";
import { SettingsSection } from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import { SettingsSaveBar } from "../../shared/settings-save-bar";
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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Storage & tracking"
        description="How precisely stock is located and identified inside this store."
      />

      <SettingsSection
        icon={<ScanLine className="h-4 w-4" />}
        title="Tracking granularity"
        description="Each level adds a step when receiving and dispatching — turn on only what you actually record."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Bin tracking"
            hint="Record which shelf or bin inside the store an item sits in."
            checked={!!v.enableBinTracking}
            onChange={(x) => p.setField("enableBinTracking", x)}
            disabled={d}
          />
          <ToggleRow
            label="Lot / batch tracking"
            hint="Keep batch identity through receipts, movements and counts."
            checked={!!v.enableLotTracking}
            onChange={(x) => p.setField("enableLotTracking", x)}
            disabled={d}
          />
          <ToggleRow
            label="Serial number tracking"
            hint="Track individual units by serial number."
            checked={!!v.enableSerialTracking}
            onChange={(x) => p.setField("enableSerialTracking", x)}
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
