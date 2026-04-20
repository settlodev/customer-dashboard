"use client";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "enableEmailNotifications",
  "enableSmsNotifications",
  "enablePushNotifications",
  "lowStockAlertEmail",
  "dailyReportEmail",
  "alertPhoneNumber",
  "sendDailySalesEmail",
  "sendWeeklySalesEmail",
] as const;

export function NotificationsPanel({
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
        description="Turn off an entire channel here to silence every outbound message at this location."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow label="Email" checked={!!v.enableEmailNotifications} onChange={(x) => p.setField("enableEmailNotifications", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="SMS" checked={!!v.enableSmsNotifications} onChange={(x) => p.setField("enableSmsNotifications", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Push" checked={!!v.enablePushNotifications} onChange={(x) => p.setField("enablePushNotifications", x)} disabled={p.isPending} />
      </SettingsSection>

      <SettingsSection
        title="Alert recipients"
        description="Who gets low-stock alerts, daily reports, and urgent SMS pings."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Low-stock alert email">
            <Input
              type="email"
              maxLength={255}
              value={v.lowStockAlertEmail ?? ""}
              onChange={(e) => p.setField("lowStockAlertEmail", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Daily report email">
            <Input
              type="email"
              maxLength={255}
              value={v.dailyReportEmail ?? ""}
              onChange={(e) => p.setField("dailyReportEmail", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="SMS alert phone number">
            <Input
              maxLength={20}
              value={v.alertPhoneNumber ?? ""}
              onChange={(e) => p.setField("alertPhoneNumber", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
        </div>
        <SettingsSwitchRow label="Daily sales summary email" checked={!!v.sendDailySalesEmail} onChange={(x) => p.setField("sendDailySalesEmail", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Weekly sales summary email" checked={!!v.sendWeeklySalesEmail} onChange={(x) => p.setField("sendWeeklySalesEmail", x)} disabled={p.isPending} />
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
