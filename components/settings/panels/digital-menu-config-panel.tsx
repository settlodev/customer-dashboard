"use client";

import { Globe, QrCode } from "lucide-react";

import {
  ControlInput,
  ControlTextarea,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Digital menu"
        description="Behaviour of the public-facing digital menu for this location. The menu itself is managed under Digital menu."
      />

      <SettingsSection
        icon={<QrCode className="h-4 w-4" />}
        title="Menu configuration"
        description="Where the menu lives and what customers can see or do on it."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <Field
            label="Custom domain"
            hint="Point a CNAME at Settlo, then enter the hostname here."
            optional
          >
            {(id) => (
              <ControlInput
                id={id}
                maxLength={255}
                prefix={<Globe className="h-3.5 w-3.5" />}
                placeholder="menu.example.com"
                value={v.digitalMenuDomain ?? ""}
                onChange={(e) => p.setField("digitalMenuDomain", e.target.value)}
                disabled={d}
              />
            )}
          </Field>
          <Field
            label="Welcome message"
            hint="Shown at the top of the menu before the first category."
            optional
            className="sm:col-span-2"
          >
            {(id) => (
              <ControlTextarea
                id={id}
                rows={3}
                placeholder="e.g. Karibu! Order straight from your table."
                value={v.digitalMenuWelcomeMessage ?? ""}
                onChange={(e) =>
                  p.setField("digitalMenuWelcomeMessage", e.target.value)
                }
                disabled={d}
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Allow ordering"
            hint="Customers can place an order straight from the menu."
            checked={!!v.enableDigitalMenuOrdering}
            onChange={(x) => p.setField("enableDigitalMenuOrdering", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show prices"
            hint="Print the selling price beside each item."
            checked={!!v.showPricesOnDigitalMenu}
            onChange={(x) => p.setField("showPricesOnDigitalMenu", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show stock availability"
            hint="Mark items that are currently out of stock."
            checked={!!v.showStockOnDigitalMenu}
            onChange={(x) => p.setField("showStockOnDigitalMenu", x)}
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
