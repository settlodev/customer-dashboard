"use client";

import { Boxes, CalendarClock, ClipboardList, PackageCheck, Timer } from "lucide-react";

import {
  ControlInput,
  RadioCards,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import type { LocationSettings } from "@/types/location-settings/type";

/**
 * Stock is cut at exactly one point in the order lifecycle — the three
 * backend flags are mutually exclusive, so they render as one choice.
 */
const DEDUCT_OPTIONS = [
  {
    value: "deductStockOnItemChange",
    label: "On item change",
    description: "Cut stock the moment an item is added or modified in an order.",
  },
  {
    value: "deductStockOnOrderClose",
    label: "On order close",
    description: "Cut stock when the order is finalised and closed.",
  },
  {
    value: "deductStockOnPartialPay",
    label: "On partial pay",
    description: "Cut stock as soon as any payment lands — useful for pre-orders.",
  },
] as const;

type DeductKey = (typeof DEDUCT_OPTIONS)[number]["value"];

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
  "allowStockRequestsOverAvailable",
] as const;

const ICON = "h-3.5 w-3.5";

export function StockInventoryPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;

  // First flag wins if a legacy record has more than one set; picking an
  // option clears the others, which normalises the record on save. Records
  // with no flag set fall back to item change — the POS default.
  const deductTrigger =
    DEDUCT_OPTIONS.find((o) => v[o.value])?.value ?? "deductStockOnItemChange";
  const setDeductTrigger = (next: DeductKey) => {
    for (const o of DEDUCT_OPTIONS) p.setField(o.value, o.value === next);
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Stock & inventory"
        description="When stock is cut, which inventory workflows are enabled, and how alerts are set."
      />

      <SettingsSection
        icon={<Boxes className="h-4 w-4" />}
        title="Stock deduction timing"
        description="When the POS actually cuts inventory. Stock is deducted once, at whichever point you pick."
      >
        <RadioCards
          value={deductTrigger}
          onChange={setDeductTrigger}
          options={DEDUCT_OPTIONS}
          disabled={d}
        />
      </SettingsSection>

      <SettingsSection
        icon={<ClipboardList className="h-4 w-4" />}
        title="Inventory policy"
        description="Day-to-day rules: alerts, negative balances, and expiry tracking."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Low-stock alerts"
            hint="Notify when on-hand falls below the threshold."
            checked={!!v.enableLowStockAlerts}
            onChange={(x) => p.setField("enableLowStockAlerts", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow negative stock"
            hint="Let staff sell items even when on-hand reaches zero."
            checked={!!v.allowNegativeStock}
            onChange={(x) => p.setField("allowNegativeStock", x)}
            disabled={d}
          />
          <ToggleRow
            label="Track expiry dates"
            hint="Capture and act on expiry per stock batch."
            checked={!!v.trackExpiryDates}
            onChange={(x) => p.setField("trackExpiryDates", x)}
            disabled={d}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Default low-stock threshold"
            hint="Used for variants with no threshold of their own."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={0}
                suffix="units"
                prefix={<PackageCheck className={ICON} />}
                value={v.defaultLowStockThreshold ?? ""}
                onChange={(e) =>
                  p.setField("defaultLowStockThreshold", parseOptionalNumber(e.target.value))
                }
                placeholder="10"
                disabled={d || !v.enableLowStockAlerts}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<PackageCheck className="h-4 w-4" />}
        title="Stock requests against this location"
        description="Applies when a store or another location raises a stock request with this location as the source."
      >
        <ToggleRow
          label="Allow requests over available quantity"
          hint="Let others request more than this location has on hand — useful when restock is already inbound. Off caps each requested line at available stock."
          checked={!!v.allowStockRequestsOverAvailable}
          onChange={(x) => p.setField("allowStockRequestsOverAvailable", x)}
          disabled={d}
        />
      </SettingsSection>

      <SettingsSection
        icon={<Boxes className="h-4 w-4" />}
        title="Inventory features"
        description="Unlock advanced inventory workflows in the dashboard. Some are gated by your plan."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Batch tracking"
            hint="Track batches, consume FEFO or FIFO, surface batch history."
            checked={!!v.batchTrackingEnabled}
            onChange={(x) => p.setField("batchTrackingEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Quality inspection on GRN"
            hint="Put received goods on inspection hold until signed off."
            checked={!!v.qualityInspectionEnabled}
            onChange={(x) => p.setField("qualityInspectionEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-reorder"
            hint="Draft a purchase order when available falls below a reorder point."
            checked={!!v.autoReorderEnabled}
            onChange={(x) => p.setField("autoReorderEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto day close snapshots"
            hint="Produce a daily closing snapshot for reconciliation."
            checked={!!v.autoClosingEnabled}
            onChange={(x) => p.setField("autoClosingEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Cycle counting & stock takes"
            hint="Count subsets of stock on a schedule without closing shop."
            checked={!!v.cycleCountingEnabled}
            onChange={(x) => p.setField("cycleCountingEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Request for quotation"
            hint="Raise quote requests across suppliers, then award the winner."
            checked={!!v.rfqEnabled}
            onChange={(x) => p.setField("rfqEnabled", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Timer className="h-4 w-4" />}
        title="Timing windows"
        description="Alert and reservation horizons."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Expiry alert lead time" hint="How far ahead of expiry to warn.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                max={365}
                suffix="days"
                prefix={<CalendarClock className={ICON} />}
                value={v.expiryAlertDays ?? ""}
                onChange={(e) =>
                  p.setField("expiryAlertDays", parseOptionalNumber(e.target.value))
                }
                placeholder="30"
                disabled={d || !v.trackExpiryDates}
              />
            )}
          </Field>
          <Field label="Reservation expiry" hint="Held stock is released after this.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                max={1440}
                suffix="min"
                prefix={<Timer className={ICON} />}
                value={v.reservationExpiryMinutes ?? ""}
                onChange={(e) =>
                  p.setField("reservationExpiryMinutes", parseOptionalNumber(e.target.value))
                }
                placeholder="60"
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
