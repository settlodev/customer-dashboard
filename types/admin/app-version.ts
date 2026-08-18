/**
 * The POS minimum-app-version gate. One row per (appType, platform); a missing
 * row means no floor is configured and every device passes.
 */
export interface AppVersionGateRow {
  appType: string;
  platform: string;
  /** Hard floor — devices below this are blocked while online. */
  minVersionCode: number;
  /** Newest published build — devices below this get a soft nag. */
  latestVersionCode: number;
  latestVersionName: string | null;
  updateUrl: string | null;
  message: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpsertAppVersionGateRequest {
  appType: string;
  platform: string;
  minVersionCode: number;
  latestVersionCode: number;
  latestVersionName?: string | null;
  updateUrl?: string | null;
  message?: string | null;
}
