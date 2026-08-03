"use client";

import { SettingsSection, SettingsSwitchRow, SettingsRadioRows } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "showAmountOnDockets",
  "printEachDocketItem",
  "showDocketCount",
  "singleDocketPrint",
  "showPriceOnDocket",
  "autoPrintDockets",
  "allowDuplicateDocketPrinting",
  "useModernPrintTemplate",
  "printDensity",
  "orderPrintsCountEnabled",
] as const;

const DENSITY_OPTIONS = [
  {
    value: "STANDARD" as const,
    label: "Standard",
    description: "Full-size layout. The most legible, and the most paper.",
  },
  {
    value: "COMPACT" as const,
    label: "Compact",
    description: "Smaller type and tighter spacing, same content. About 30% shorter.",
  },
  {
    value: "ULTRA" as const,
    label: "Ultra compact",
    description:
      "Smallest legible type, and drops the header logo, the receipt QR caption and the order duration. About 50% shorter.",
  },
];

export function DocketsPanel({
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
        title="Dockets"
        description="What goes on the paper that reaches the kitchen or bar, and how prints are controlled."
      />

      <SettingsSection
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Modern print layout"
          description="Use the new designed print layout (images) for dockets and bills. Turn off for the classic text layout (legacy)."
          checked={!!v.useModernPrintTemplate}
          onChange={(x) => p.setField("useModernPrintTemplate", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Show amount on dockets"
          description="Shows the order amount on the printed docket."
          checked={!!v.showAmountOnDockets}
          onChange={(x) => p.setField("showAmountOnDockets", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Print each item on its own docket"
          description="Prints every item on a separate docket instead of grouping them together."
          checked={!!v.printEachDocketItem}
          onChange={(x) => p.setField("printEachDocketItem", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Show docket count"
          description="Shows the docket count on each printout."
          checked={!!v.showDocketCount}
          onChange={(x) => p.setField("showDocketCount", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Single-docket print (per order)"
          description="Forces all dockets to print on the main printer."
          checked={!!v.singleDocketPrint}
          onChange={(x) => p.setField("singleDocketPrint", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Show price on kitchen docket"
          description="Shows each item's price on the kitchen docket."
          checked={!!v.showPriceOnDocket}
          onChange={(x) => p.setField("showPriceOnDocket", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Auto-print dockets"
          description="Automatically prints dockets when an order is sent, without manual action."
          checked={!!v.autoPrintDockets}
          onChange={(x) => p.setField("autoPrintDockets", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Allow duplicate docket prints"
          description="Permits reprinting a docket that has already been printed."
          checked={!!v.allowDuplicateDocketPrinting}
          onChange={(x) => p.setField("allowDuplicateDocketPrinting", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Count order prints"
          description="Tracks how many times each order has been printed."
          checked={!!v.orderPrintsCountEnabled}
          onChange={(x) => p.setField("orderPrintsCountEnabled", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Print density"
        description="How tightly the modern layout packs bills, receipts and dockets. Kitchen dockets shrink less than receipts so they stay readable from a rail. The classic text layout ignores this."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsRadioRows
          value={v.printDensity ?? "STANDARD"}
          onChange={(next) => p.setField("printDensity", next)}
          options={DENSITY_OPTIONS}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}
