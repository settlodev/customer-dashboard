"use client";

import { Boxes, PackagePlus, ScanBarcode } from "lucide-react";

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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Stock & inventory"
        description="How this store tracks what it holds. A store never sells — these rules apply to receiving, moving and counting stock."
      />

      <SettingsSection
        icon={<Boxes className="h-4 w-4" />}
        title="Inventory policy"
        description="Day-to-day rules for balances held at this store."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Track inventory"
            hint="Keep per-item balances here. Off means stock passes through uncounted."
            checked={!!v.trackInventory}
            onChange={(x) => p.setField("trackInventory", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow negative stock"
            hint="Let balances fall below zero rather than blocking the movement."
            checked={!!v.allowNegativeStock}
            onChange={(x) => p.setField("allowNegativeStock", x)}
            disabled={d}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Default reorder quantity"
            hint="Pre-filled when this store raises a stock request."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="units"
                prefix={<PackagePlus className="h-3.5 w-3.5" />}
                value={v.defaultReorderQuantity ?? ""}
                onChange={(e) =>
                  p.setField("defaultReorderQuantity", parseOptionalNumber(e.target.value))
                }
                placeholder="None"
                disabled={d}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<ScanBarcode className="h-4 w-4" />}
        title="Operations"
        description="Scanning and low-stock behaviour."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Barcode scanning"
            hint="Scan items when receiving, counting and dispatching."
            checked={!!v.enableBarcodeScanning}
            onChange={(x) => p.setField("enableBarcodeScanning", x)}
            disabled={d}
          />
          <ToggleRow
            label="Notify parent location"
            hint="Alert the location this store serves when a balance drops below its reorder point."
            checked={!!v.notifyLocationOnLowStock}
            onChange={(x) => p.setField("notifyLocationOnLowStock", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-request stock"
            hint="Raise a stock request automatically at the reorder point."
            checked={!!v.autoRequestStock}
            onChange={(x) => p.setField("autoRequestStock", x)}
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
