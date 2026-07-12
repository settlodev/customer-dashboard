"use client";

import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateDeviceId, requestPermissionAndGetToken } from "@/lib/firebase/messaging";
import { registerPushToken, deletePushToken } from "@/lib/actions/push-token-actions";

const KEYS = [
  "enableEmailNotifications",
  "enableSmsNotifications",
  "enablePushNotifications",
  "lowStockAlertEmail",
  "lowStockAlertEmailCc",
  "dailyReportEmail",
  "dailyReportEmailCc",
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
  const { toast } = useToast();

  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const swReg = await navigator.serviceWorker?.getRegistration("/firebase-messaging-sw.js");
        const token = await requestPermissionAndGetToken(swReg ?? undefined);
        if (!token) {
          toast({
            variant: "destructive",
            title: "Couldn't enable notifications",
            description: "Allow notifications for this site in your browser, then try again.",
          });
          return;
        }
        const result = await registerPushToken({ fcmToken: token, deviceId: getOrCreateDeviceId() });
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Couldn't enable notifications",
            description: "Registration failed. Please try again.",
          });
          return;
        }
        p.setField("enablePushNotifications", true);
      } else {
        await deletePushToken(getOrCreateDeviceId());
        p.setField("enablePushNotifications", false);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn't update notification settings. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Notifications"
        description="Channels, alert recipients, and recurring summaries for this location."
      />

      <SettingsSection
        title="Channels"
        description="Turn off an entire channel here to silence every outbound message at this location."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow label="Email" checked={!!v.enableEmailNotifications} onChange={(x) => p.setField("enableEmailNotifications", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="SMS" checked={!!v.enableSmsNotifications} onChange={(x) => p.setField("enableSmsNotifications", x)} disabled={p.isPending} />
        <SettingsSwitchRow
          label="Push"
          checked={!!v.enablePushNotifications}
          onChange={(x) => void handlePushToggle(x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Alert recipients"
        description="Who gets low-stock alerts, daily reports, and urgent SMS pings."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Low-stock alert email">
            <Input
              type="email"
              maxLength={255}
              value={v.lowStockAlertEmail ?? ""}
              onChange={(e) => p.setField("lowStockAlertEmail", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Low-stock alert CC">
            <Input
              type="text"
              maxLength={512}
              placeholder="a@x.com, b@y.com"
              value={v.lowStockAlertEmailCc ?? ""}
              onChange={(e) => p.setField("lowStockAlertEmailCc", e.target.value)}
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
          <Field label="Daily report CC">
            <Input
              type="text"
              maxLength={512}
              placeholder="a@x.com, b@y.com"
              value={v.dailyReportEmailCc ?? ""}
              onChange={(e) => p.setField("dailyReportEmailCc", e.target.value)}
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
