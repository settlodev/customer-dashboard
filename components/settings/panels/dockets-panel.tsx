"use client";

import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "showAmountOnDockets",
  "printEachDocketItem",
  "showDocketCount",
  "singleTicketPrint",
  "showPriceOnTicket",
  "autoPrintTickets",
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
      title="Kitchen dockets & tickets"
      description="What goes on the paper that reaches the kitchen or bar."
      onSave={p.save}
      isPending={p.isPending}
      isDirty={p.isDirty}
    >
      <SettingsSwitchRow label="Show amount on dockets" checked={!!v.showAmountOnDockets} onChange={(x) => p.setField("showAmountOnDockets", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Print each item on its own docket" checked={!!v.printEachDocketItem} onChange={(x) => p.setField("printEachDocketItem", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Show docket count" checked={!!v.showDocketCount} onChange={(x) => p.setField("showDocketCount", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Single-ticket print (per order)" checked={!!v.singleTicketPrint} onChange={(x) => p.setField("singleTicketPrint", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Show price on kitchen ticket" checked={!!v.showPriceOnTicket} onChange={(x) => p.setField("showPriceOnTicket", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Auto-print tickets" checked={!!v.autoPrintTickets} onChange={(x) => p.setField("autoPrintTickets", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Allow duplicate docket prints" checked={!!v.allowDuplicateDocketPrinting} onChange={(x) => p.setField("allowDuplicateDocketPrinting", x)} disabled={p.isPending} />
      <SettingsSwitchRow label="Count order prints" description="Tracks how many times each order has been printed." checked={!!v.orderPrintsCountEnabled} onChange={(x) => p.setField("orderPrintsCountEnabled", x)} disabled={p.isPending} />
    </SettingsSection>
  );
}
