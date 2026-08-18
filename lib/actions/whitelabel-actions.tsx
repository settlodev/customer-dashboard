"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";

export interface WhitelabelBranding {
  appName: string;
  code: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  logoSquareUrl?: string;
  logoWideUrl?: string;
  faviconUrl?: string;
  bannerImageUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  googleOAuthEnabled: boolean;
  appleOAuthEnabled: boolean;
}

export const getWhitelabelBranding = async (): Promise<WhitelabelBranding | null> => {
  try {
    const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
    if (!clientId) return null;

    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get(`/api/v1/public/whitelabel/branding?clientId=${clientId}`);
    return parseStringify(data);
  } catch {
    return null;
  }
};
