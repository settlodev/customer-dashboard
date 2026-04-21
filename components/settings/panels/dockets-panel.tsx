"use client";

import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "showAmountOnDockets",
  "printEachDocketItem",
  "showDocketCount",
  "singleDocketPrint",
  "showPriceOnDocket",
  "autoPrintDockets",
  "allowDuplicateDocketPrinting",
  "orderPrintsCountEnabled",
] as const;

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
    <SettingsSection
      title="Kitchen dockets"
      description="What goes on the paper that reaches the kitchen or bar."
      onSave={p.save}
      isPending={p.isPending}
      isDirty={p.isDirty}
    >
      <SettingsSwitchRow label="Show amount on dockets" checked={!!v.showAmountOnDockets} onChange={(x) => p.setField("showAmountOnDockets", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Print each item on its own docket" checked={!!v.printEachDocketItem} onChange={(x) => p.setField("printEachDocketItem", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Show docket count" checked={!!v.showDocketCount} onChange={(x) => p.setField("showDocketCount", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Single-docket print (per order)" checked={!!v.singleDocketPrint} onChange={(x) => p.setField("singleDocketPrint", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Show price on kitchen docket" checked={!!v.showPriceOnDocket} onChange={(x) => p.setField("showPriceOnDocket", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Auto-print dockets" checked={!!v.autoPrintDockets} onChange={(x) => p.setField("autoPrintDockets", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Allow duplicate docket prints" checked={!!v.allowDuplicateDocketPrinting} onChange={(x) => p.setField("allowDuplicateDocketPrinting", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Count order prints" description="Tracks how many times each order has been printed." checked={!!v.orderPrintsCountEnabled} onChange={(x) => p.setField("orderPrintsCountEnabled", x)} disabled={p.isPending} />
    </SettingsSection>
  );
}
