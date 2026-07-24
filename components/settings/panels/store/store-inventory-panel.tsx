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
  "trackInventory",
  "allowNegativeStock",
  "defaultReorderQuantity",
  "enableBarcodeScanning",
  "notifyLocationOnLowStock",
  "autoRequestStock",
] as const;

export function StoreInventoryPanel({
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
        title="Stock & inventory"
        description="How this store tracks what it holds. A store never sells — these rules apply to receiving, moving and counting stock."
      />

      <SettingsSection
        title="Inventory policy"
        description="Day-to-day rules for balances held at this store."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Track inventory"
          description="Keep per-item balances for this store. Off means stock moves through without being counted here."
          checked={!!v.trackInventory}
          onChange={(x) => p.setField("trackInventory", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Allow negative stock"
          description="Let balances at this store fall below zero rather than blocking the movement."
          checked={!!v.allowNegativeStock}
          onChange={(x) => p.setField("allowNegativeStock", x)}
          disabled={p.isPending}
        />
        <SettingsField
          label="Default reorder quantity"
          hint="Pre-filled when this store raises a stock request. Leave empty for none."
        >
          <Input
            type="number"
            min={1}
            value={v.defaultReorderQuantity ?? ""}
            onChange={(e) =>
              p.setField(
                "defaultReorderQuantity",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            disabled={p.isPending}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title="Operations"
        description="Scanning and low-stock behaviour."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Barcode scanning"
          description="Scan items when receiving, counting and dispatching from this store."
          checked={!!v.enableBarcodeScanning}
          onChange={(x) => p.setField("enableBarcodeScanning", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Notify the parent location on low stock"
          description="Alert the location this store serves when a balance drops below its reorder point."
          checked={!!v.notifyLocationOnLowStock}
          onChange={(x) => p.setField("notifyLocationOnLowStock", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Auto-request stock"
          description="Automatically raise a stock request when a balance falls below its reorder point."
          checked={!!v.autoRequestStock}
          onChange={(x) => p.setField("autoRequestStock", x)}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}
