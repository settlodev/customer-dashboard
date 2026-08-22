/**
 * Icons compiled into the POS APK as activity-aliases. SOURCE OF TRUTH is the
 * app's `AppIconName` union in Settlo-Pro-V3 `src/lib/api/types/appCampaign.ts`
 * — a value not in that union does nothing on every device, so this must stay
 * a select, never free text.
 */
export const APP_ICON_OPTIONS = ["DEFAULT", "CHRISTMAS", "EASTER"] as const;
export type AppIconName = (typeof APP_ICON_OPTIONS)[number];

export interface AppCampaignRow {
  id: string;
  name: string;
  appType: string;
  platform: string;
  startsAt: string;
  endsAt: string;
  priority: number;
  enabled: boolean;
  appIcon: AppIconName | null;
  message: string | null;
  messageIcon: string | null;
  cta: string | null;
  minAppVersionCode: number | null;
}

export type UpsertAppCampaignRequest = Omit<AppCampaignRow, "id">;
