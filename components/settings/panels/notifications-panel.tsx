"use client";

import { Bell, BellRing, Mail, Phone, Users } from "lucide-react";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
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

const ICON = "h-3.5 w-3.5";

export function NotificationsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;
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

  // Recipient fields are useless while their channel is off — grey them out
  // rather than hide them, so the configured values stay visible.
  const emailOff = !v.enableEmailNotifications;
  const smsOff = !v.enableSmsNotifications;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Notifications"
        description="Channels, alert recipients, and recurring summaries for this location."
      />

      <SettingsSection
        icon={<Bell className="h-4 w-4" />}
        title="Channels"
        description="Turn off an entire channel here to silence every outbound message at this location."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ToggleRow
            label="Email"
            hint="Alerts, reports and receipts sent by email."
            checked={!!v.enableEmailNotifications}
            onChange={(x) => p.setField("enableEmailNotifications", x)}
            disabled={d}
          />
          <ToggleRow
            label="SMS"
            hint="Urgent pings to the alert phone number."
            checked={!!v.enableSmsNotifications}
            onChange={(x) => p.setField("enableSmsNotifications", x)}
            disabled={d}
          />
          <ToggleRow
            label="Push"
            hint="Browser notifications on this device."
            checked={!!v.enablePushNotifications}
            onChange={(x) => void handlePushToggle(x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Users className="h-4 w-4" />}
        title="Alert recipients"
        description="Who gets low-stock alerts, daily reports, and urgent SMS pings."
        aside={
          emailOff ? (
            <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              Email off
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <Field label="Low-stock alert email">
            {(id) => (
              <ControlInput
                id={id}
                type="email"
                inputMode="email"
                maxLength={255}
                prefix={<Mail className={ICON} />}
                placeholder="stock@business.com"
                value={v.lowStockAlertEmail ?? ""}
                onChange={(e) => p.setField("lowStockAlertEmail", e.target.value)}
                disabled={d || emailOff}
              />
            )}
          </Field>
          <Field label="Low-stock alert CC" hint="Comma-separated addresses.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={512}
                prefix={<Mail className={ICON} />}
                placeholder="a@x.com, b@y.com"
                value={v.lowStockAlertEmailCc ?? ""}
                onChange={(e) => p.setField("lowStockAlertEmailCc", e.target.value)}
                disabled={d || emailOff}
              />
            )}
          </Field>
          <Field label="Daily report email">
            {(id) => (
              <ControlInput
                id={id}
                type="email"
                inputMode="email"
                maxLength={255}
                prefix={<Mail className={ICON} />}
                placeholder="reports@business.com"
                value={v.dailyReportEmail ?? ""}
                onChange={(e) => p.setField("dailyReportEmail", e.target.value)}
                disabled={d || emailOff}
              />
            )}
          </Field>
          <Field label="Daily report CC" hint="Comma-separated addresses.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={512}
                prefix={<Mail className={ICON} />}
                placeholder="a@x.com, b@y.com"
                value={v.dailyReportEmailCc ?? ""}
                onChange={(e) => p.setField("dailyReportEmailCc", e.target.value)}
                disabled={d || emailOff}
              />
            )}
          </Field>
          <Field
            label="SMS alert phone number"
            hint={smsOff ? "Turn the SMS channel on to use this." : undefined}
          >
            {(id) => (
              <ControlInput
                id={id}
                type="tel"
                inputMode="tel"
                maxLength={20}
                prefix={<Phone className={ICON} />}
                placeholder="+255 712 345 678"
                value={v.alertPhoneNumber ?? ""}
                onChange={(e) => p.setField("alertPhoneNumber", e.target.value)}
                disabled={d || smsOff}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<BellRing className="h-4 w-4" />}
        title="Recurring summaries"
        description="Scheduled sales digests sent to the daily report recipients above."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Daily sales summary"
            hint="Yesterday's takings, sent each morning."
            checked={!!v.sendDailySalesEmail}
            onChange={(x) => p.setField("sendDailySalesEmail", x)}
            disabled={d || emailOff}
          />
          <ToggleRow
            label="Weekly sales summary"
            hint="The week in review, sent on Mondays."
            checked={!!v.sendWeeklySalesEmail}
            onChange={(x) => p.setField("sendWeeklySalesEmail", x)}
            disabled={d || emailOff}
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
