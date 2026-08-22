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
  // The server column is a free VARCHAR(40), not this dashboard's closed
  // enum — a row authored via the API (or by a future app version with more
  // icons) can hold a value outside AppIconName. Widen the row type rather
  // than narrow it; `toForm` normalises unknown values to "no icon change".
  appIcon: string | null;
  message: string | null;
  messageIcon: string | null;
  cta: string | null;
  minAppVersionCode: number | null;
}

// The request stays closed to the known enum: this dashboard only ever
// *authors* one of APP_ICON_OPTIONS, even though the row it reads back can
// hold more than that (see AppCampaignRow.appIcon).
export type UpsertAppCampaignRequest = Omit<AppCampaignRow, "id" | "appIcon"> & {
  appIcon: AppIconName | null;
};
