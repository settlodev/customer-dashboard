"use client";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "enableOnlineOrdering",
  "enableDelivery",
  "defaultDeliveryFee",
  "minimumDeliveryOrderAmount",
  "enablePickup",
  "enableDineIn",
  "defaultPrepTimeMinutes",
  "acceptScheduledOrders",
  "maxScheduleDaysAhead",
] as const;

export function OrderChannelsPanel({
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
      <SettingsSection
        title="Channels"
        description="Which fulfilment routes this location accepts."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Online ordering"
          description="Accept orders coming through the digital menu or web storefront."
          checked={!!v.enableOnlineOrdering}
          onChange={(x) => p.setField("enableOnlineOrdering", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Delivery"
          checked={!!v.enableDelivery}
          onChange={(x) => p.setField("enableDelivery", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Pickup"
          checked={!!v.enablePickup}
          onChange={(x) => p.setField("enablePickup", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Dine-in"
          checked={!!v.enableDineIn}
          onChange={(x) => p.setField("enableDineIn", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Delivery defaults"
        description="Defaults applied when a customer places a delivery order."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Default delivery fee">
            <Input
              type="number"
              min={0}
              value={v.defaultDeliveryFee ?? ""}
              onChange={(e) =>
                p.setField(
                  "defaultDeliveryFee",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending || !v.enableDelivery}
            />
          </Field>
          <Field label="Minimum delivery order amount">
            <Input
              type="number"
              min={0}
              value={v.minimumDeliveryOrderAmount ?? ""}
              onChange={(e) =>
                p.setField(
                  "minimumDeliveryOrderAmount",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending || !v.enableDelivery}
            />
          </Field>
          <Field label="Default prep time (minutes)">
            <Input
              type="number"
              min={0}
              value={v.defaultPrepTimeMinutes ?? ""}
              onChange={(e) =>
                p.setField(
                  "defaultPrepTimeMinutes",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Scheduled orders"
        description="Allow customers to place orders for a future time."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Accept scheduled orders"
          checked={!!v.acceptScheduledOrders}
          onChange={(x) => p.setField("acceptScheduledOrders", x)}
          disabled={p.isPending}
        />
        {v.acceptScheduledOrders && (
          <Field label="Maximum days ahead">
            <Input
              type="number"
              min={0}
              max={365}
              value={v.maxScheduleDaysAhead ?? ""}
              onChange={(e) =>
                p.setField(
                  "maxScheduleDaysAhead",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
        )}
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
