"use client";

import { Bike, CalendarClock, Globe, ShoppingBag, Timer, Truck } from "lucide-react";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
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

const ICON = "h-3.5 w-3.5";

export function OrderChannelsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;
  const currency = settings.currency || undefined;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Order channels"
        description="Fulfilment routes this location accepts and their defaults."
      />

      <SettingsSection
        icon={<Truck className="h-4 w-4" />}
        title="Channels"
        description="Which fulfilment routes this location accepts."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Online ordering"
            hint="Accept orders through the digital menu or web storefront."
            checked={!!v.enableOnlineOrdering}
            onChange={(x) => p.setField("enableOnlineOrdering", x)}
            disabled={d}
          />
          <ToggleRow
            label="Delivery"
            hint="Send orders out to the customer's address."
            checked={!!v.enableDelivery}
            onChange={(x) => p.setField("enableDelivery", x)}
            disabled={d}
          />
          <ToggleRow
            label="Pickup"
            hint="Customers collect from the counter."
            checked={!!v.enablePickup}
            onChange={(x) => p.setField("enablePickup", x)}
            disabled={d}
          />
          <ToggleRow
            label="Dine-in"
            hint="Orders are served at the premises."
            checked={!!v.enableDineIn}
            onChange={(x) => p.setField("enableDineIn", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Bike className="h-4 w-4" />}
        title="Delivery defaults"
        description="Defaults applied when a customer places a delivery order."
        aside={
          !v.enableDelivery ? (
            <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              Delivery off
            </span>
          ) : undefined
        }
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Default delivery fee" hint="Added to every delivery order unless overridden.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={currency}
                prefix={<Bike className={ICON} />}
                value={v.defaultDeliveryFee ?? ""}
                onChange={(e) =>
                  p.setField("defaultDeliveryFee", parseOptionalNumber(e.target.value))
                }
                placeholder="0"
                disabled={d || !v.enableDelivery}
              />
            )}
          </Field>
          <Field label="Minimum delivery order" hint="Delivery orders below this are refused.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                suffix={currency}
                prefix={<ShoppingBag className={ICON} />}
                value={v.minimumDeliveryOrderAmount ?? ""}
                onChange={(e) =>
                  p.setField("minimumDeliveryOrderAmount", parseOptionalNumber(e.target.value))
                }
                placeholder="0"
                disabled={d || !v.enableDelivery}
              />
            )}
          </Field>
          <Field label="Default prep time" hint="Quoted to customers on every channel.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={0}
                suffix="min"
                prefix={<Timer className={ICON} />}
                value={v.defaultPrepTimeMinutes ?? ""}
                onChange={(e) =>
                  p.setField("defaultPrepTimeMinutes", parseOptionalNumber(e.target.value))
                }
                placeholder="15"
                disabled={d}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<CalendarClock className="h-4 w-4" />}
        title="Scheduled orders"
        description="Allow customers to place orders for a future time."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Accept scheduled orders"
            hint="Customers pick a future pickup or delivery time at checkout."
            checked={!!v.acceptScheduledOrders}
            onChange={(x) => p.setField("acceptScheduledOrders", x)}
            disabled={d}
            className="sm:col-span-2 lg:col-span-2"
          />
          <Field label="Maximum days ahead" hint="How far into the future a slot can be booked.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={0}
                max={365}
                suffix="days"
                prefix={<Globe className={ICON} />}
                value={v.maxScheduleDaysAhead ?? ""}
                onChange={(e) =>
                  p.setField("maxScheduleDaysAhead", parseOptionalNumber(e.target.value))
                }
                placeholder="7"
                disabled={d || !v.acceptScheduledOrders}
              />
            )}
          </Field>
        </div>
      </SettingsSection>
    </div>
  );
}
