"use client";

import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "enableCustomerAccounts",
  "enableCustomerReviews",
] as const;

export function CustomerPanel({
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
      title="Customer accounts & reviews"
      description="Lets customers sign in for self-service and submit reviews."
      onSave={p.save}
      isPending={p.isPending}
      isDirty={p.isDirty}
    >
      <SettingsSwitchRow
        label="Enable customer accounts"
        description="Allow customers to register, save addresses and track orders."
        checked={!!v.enableCustomerAccounts}
        onChange={(x) => p.setField("enableCustomerAccounts", x)}
        disabled={p.isPending}
      />
      <SettingsSwitchRow
        label="Enable customer reviews"
        description="Collect ratings and comments after each order."
        checked={!!v.enableCustomerReviews}
        onChange={(x) => p.setField("enableCustomerReviews", x)}
        disabled={p.isPending}
      />
    </SettingsSection>
  );
}
