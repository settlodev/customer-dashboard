"use client";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "deductStockOnItemChange",
  "deductStockOnOrderClose",
  "deductStockOnPartialPay",
  "batchTrackingEnabled",
  "qualityInspectionEnabled",
  "autoReorderEnabled",
  "autoClosingEnabled",
  "cycleCountingEnabled",
  "rfqEnabled",
  "expiryAlertDays",
  "reservationExpiryMinutes",
  "enableLowStockAlerts",
  "defaultLowStockThreshold",
  "allowNegativeStock",
  "trackExpiryDates",
] as const;

export function StockInventoryPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Stock & inventory"
        description="When stock is cut, which inventory workflows are enabled, and how alerts are set."
      />

      <SettingsSection
        title="Stock deduction timing"
        description="When the POS actually cuts inventory. Pick any combination — more triggers = more accurate on-hand counts."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Deduct on item change"
          description="Cut stock the moment an item is added or modified in an order."
          checked={!!v.deductStockOnItemChange}
          onChange={(x) => p.setField("deductStockOnItemChange", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Deduct on order close"
          description="Cut stock when the order is finalised and closed."
          checked={!!v.deductStockOnOrderClose}
          onChange={(x) => p.setField("deductStockOnOrderClose", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Deduct on partial pay"
          description="Cut stock as soon as any payment is received — useful for pre-orders."
          checked={!!v.deductStockOnPartialPay}
          onChange={(x) => p.setField("deductStockOnPartialPay", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Inventory policy"
        description="Day-to-day rules: alerts, negative balances, and expiry tracking."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Low-stock alerts"
          description="Notify when on-hand falls below the threshold."
          checked={!!v.enableLowStockAlerts}
          onChange={(x) => p.setField("enableLowStockAlerts", x)}
          disabled={p.isPending}
        />
        {v.enableLowStockAlerts && (
          <Field label="Default low-stock threshold">
            <Input
              type="number"
              min={0}
              value={v.defaultLowStockThreshold ?? ""}
              onChange={(e) =>
                p.setField(
                  "defaultLowStockThreshold",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
        )}
        <SettingsSwitchRow
          label="Allow negative stock"
          description="Let staff sell items even when on-hand reaches zero."
          checked={!!v.allowNegativeStock}
          onChange={(x) => p.setField("allowNegativeStock", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Track expiry dates"
          description="Capture and act on expiry per stock batch."
          checked={!!v.trackExpiryDates}
          onChange={(x) => p.setField("trackExpiryDates", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Inventory features"
        description="Unlock advanced inventory workflows in the dashboard. Some are gated by your plan."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Batch tracking"
          description="Track batches, consume FEFO/FIFO, surface batch-level history."
          checked={!!v.batchTrackingEnabled}
          onChange={(x) => p.setField("batchTrackingEnabled", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Quality inspection on GRN"
          description="Puts received goods on inspection hold until signed off."
          checked={!!v.qualityInspectionEnabled}
          onChange={(x) => p.setField("qualityInspectionEnabled", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Auto-reorder"
          description="Auto-draft an LPO when available qty falls below a variant's reorder point."
          checked={!!v.autoReorderEnabled}
          onChange={(x) => p.setField("autoReorderEnabled", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Auto day close (inventory snapshots)"
          description="Automatically produce a daily closing snapshot for reconciliation."
          checked={!!v.autoClosingEnabled}
          onChange={(x) => p.setField("autoClosingEnabled", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Cycle counting / stock takes"
          checked={!!v.cycleCountingEnabled}
          onChange={(x) => p.setField("cycleCountingEnabled", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Request for Quotation (RFQ)"
          description="Raise quote requests across multiple suppliers, award the winner."
          checked={!!v.rfqEnabled}
          onChange={(x) => p.setField("rfqEnabled", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Timing windows"
        description="Alert and reservation horizons."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Expiry alert (days ahead)">
            <Input
              type="number"
              min={1}
              max={365}
              value={v.expiryAlertDays ?? ""}
              onChange={(e) =>
                p.setField(
                  "expiryAlertDays",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
          <Field label="Reservation expiry (minutes)">
            <Input
              type="number"
              min={1}
              max={1440}
              value={v.reservationExpiryMinutes ?? ""}
              onChange={(e) =>
                p.setField(
                  "reservationExpiryMinutes",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
        </div>
      </SettingsSection>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
