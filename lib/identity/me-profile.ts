import "server-only";

import { cache } from "react";

import { getAuthToken } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";

/** GET /api/v1/me/profile — the signed-in identity's own row in this account. */
export interface MeProfile {
  authId?: string;
  accountId?: string;
  /** OWNER | MEMBER | STAFF | ACCOUNT. */
  relationship?: "OWNER" | "MEMBER" | "STAFF" | "ACCOUNT";
  memberId?: string | null;
  staffId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  pictureUrl?: string | null;
  /** Account holders only — members and staff have no bio column. */
  bio?: string | null;
}

/**
 * Per-request memoized `/me/profile`. React `cache()` (never `unstable_cache`,
 * which would freeze the cookie-derived auth headers) so the layout and the page
 * in one render share a single Accounts round-trip.
 *
 * Returns `null` when the call fails — callers fall back to the authToken
 * cookie.
 */
export const getMyProfileCached = cache(async (): Promise<MeProfile | null> => {
  try {
    const apiClient = new ApiClient(); // accounts service
    return await apiClient.get<MeProfile | null>("/api/v1/me/profile");
  } catch {
    return null;
  }
});

/**
 * Who to show as the signed-in user: their OWN name, not the account holder's.
 *
 * The authToken cookie is written at login from `GET /accounts/{accountId}`,
 * which is the account HOLDER for every caller — so an invited member or a
 * dashboard-staff user carried the owner's name in their cookie and got greeted
 * with it. Login now overlays `/me/profile` onto the cookie, and reading through
 * this helper additionally repairs sessions that were minted before that fix
 * (and keeps the name right if the person is renamed mid-session) without
 * forcing a re-login.
 *
 * Falls back to the cookie whenever `/me/profile` is unavailable.
 */
export const getMyDisplayIdentity = cache(
  async (): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    pictureUrl: string | null;
  }> => {
    const [authToken, profile] = await Promise.all([
      getAuthToken(),
      getMyProfileCached(),
    ]);
    const hasName = !!(profile?.firstName || profile?.lastName);
    return {
      firstName: (hasName ? profile?.firstName : authToken?.firstName) ?? "",
      lastName: (hasName ? profile?.lastName : authToken?.lastName) ?? "",
      email: profile?.email || authToken?.email || "",
      phoneNumber:
        (hasName ? profile?.phoneNumber : null) ?? authToken?.phoneNumber ?? "",
      // Their own avatar (members and staff each have a picture_url) — never
      // the account holder's borrowed for someone else.
      pictureUrl: hasName
        ? (profile?.pictureUrl ?? null)
        : (authToken?.pictureUrl ?? null),
    };
  },
);
