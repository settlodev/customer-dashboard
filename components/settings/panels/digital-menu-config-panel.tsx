"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "digitalMenuDomain",
  "enableDigitalMenuOrdering",
  "showPricesOnDigitalMenu",
  "showStockOnDigitalMenu",
  "digitalMenuWelcomeMessage",
] as const;

export function DigitalMenuConfigPanel({
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
      title="Digital menu config"
      description="Behaviour of the public-facing digital menu for this location. The menu itself is managed under Digital menu."
      onSave={p.save}
      isPending={p.isPending}
      isDirty={p.isDirty}
    >
      <Field label="Custom domain">
        <Input
          maxLength={255}
          placeholder="menu.example.com"
          value={v.digitalMenuDomain ?? ""}
          onChange={(e) => p.setField("digitalMenuDomain", e.target.value)}
          disabled={p.isPending}
        />
      </Field>
      <SettingsSwitchRow
        label="Allow ordering from the digital menu"
        checked={!!v.enableDigitalMenuOrdering}
        onChange={(x) => p.setField("enableDigitalMenuOrdering", x)}
        disabled={p.isPending}
      />
      <SettingsSwitchRow
        label="Show prices on the digital menu"
        checked={!!v.showPricesOnDigitalMenu}
        onChange={(x) => p.setField("showPricesOnDigitalMenu", x)}
        disabled={p.isPending}
      />
      <SettingsSwitchRow
        label="Show stock availability on the digital menu"
        checked={!!v.showStockOnDigitalMenu}
        onChange={(x) => p.setField("showStockOnDigitalMenu", x)}
        disabled={p.isPending}
      />
      <Field label="Welcome message">
        <Textarea
          rows={3}
          value={v.digitalMenuWelcomeMessage ?? ""}
          onChange={(e) => p.setField("digitalMenuWelcomeMessage", e.target.value)}
          disabled={p.isPending}
        />
      </Field>
    </SettingsSection>
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
