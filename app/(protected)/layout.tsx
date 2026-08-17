import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import {
  DashboardSidebarShell,
  MobileTopBar,
  SidebarProvider,
} from "@/components/sidebar/dashboard-sidebar";
import { LoadingBarProvider } from "@/components/navigation/loading-bar-provider";
import {
  getBusinessDropDown,
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { hasPackagingStock } from "@/lib/actions/stock-actions";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { getAuthToken } from "@/lib/auth-utils";
import { getMyPermissionsCached, hasReportsReadAll } from "@/lib/permissions/me";
import { getMyDisplayIdentity } from "@/lib/identity/me-profile";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EntitlementProvider } from "@/context/entitlementContext";
import { PermissionsProvider } from "@/context/permissionsContext";
import { getEntitlementSnapshot, isEntitlementGatingConfigured } from "@/lib/entitlements/snapshot";
import { decideDestinationAccess } from "@/lib/entitlements/gate";
import { ExpiredTopBar } from "@/components/subscription/ExpiredTopBar";
import { fetchAllStores, getCurrentStore } from "@/lib/actions/store-actions";
import WhatsAppButton from "@/components/whatsapp-button";
import { DaySessionWidget } from "@/components/widgets/day-session-widget";
import { BuildPill } from "@/components/widgets/build-pill";
import { SettloRealtimeListener } from "@/components/realtime/settlo-realtime-listener";
import { StockCacheRealtimeBinder } from "@/components/realtime/stock-cache-realtime-binder";
import { CustomerCacheRealtimeBinder } from "@/components/realtime/customer-cache-realtime-binder";
import { NotificationRealtimeBridge } from "@/components/notifications/notification-realtime-bridge";
import { AppNotificationProviders } from "@/components/providers/app-notification-providers";
import { ImpersonationBanner } from "@/components/impersonation/impersonation-banner";
import type { ExtendedUser } from "@/types/types";

// Every page under (protected) resolves identity from cookies (authToken,
// X-Client-Id, active-destination headers) via the ApiClient interceptors,
// so none of them can be statically prerendered. Declaring it here cascades
// to all nested routes — without it, the build's static-generation pass hits
// `cookies()`, throws Next's DYNAMIC_SERVER_USAGE bailout, and logs it as a
// spurious error (e.g. "Error fetching location") before falling back to
// dynamic rendering anyway.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authToken = await getAuthToken();

  // Fetch the caller's permission keys concurrently with the layout data below
  // (this runs on every protected page render). `GET /api/v1/permissions/me` is
  // server-authoritative — it resolves the token's perm_ids via the catalog — so
  // the dashboard no longer decodes the token's `permissions` claim itself and
  // keeps working after that claim is dropped from minted tokens.
  const permissionsPromise: Promise<string[] | null> = authToken?.accessToken
    ? getMyPermissionsCached()
    : Promise.resolve(null);

  // When the location's subscription is expired/cancelled, show a minimal
  // layout with just a top bar and logout — no sidebar, no full dashboard.
  const isSubscriptionDead =
    authToken?.subscriptionStatus === "EXPIRED" ||
    authToken?.subscriptionStatus === "CANCELLED";

  const results = await Promise.allSettled([
    getCurrentBusiness(),
    getCurrentLocation(),
    getBusinessDropDown(),
    fetchAllLocations(),
    getCurrentWarehouse(),
    getEntitlementSnapshot(),
    fetchAllStores(),
    searchWarehouses(),
    getCurrentStore(),
    hasPackagingStock(),
  ]);

  const currentBusiness = results[0].status === "fulfilled" ? results[0].value ?? undefined : undefined;
  const currentLocation = results[1].status === "fulfilled" ? results[1].value ?? undefined : undefined;
  const businessList = results[2].status === "fulfilled" ? results[2].value ?? undefined : undefined;
  const locationList = results[3].status === "fulfilled" ? results[3].value : undefined;
  const currentWarehouse = results[4].status === "fulfilled" ? results[4].value : undefined;
  const entitlementSnapshot =
    results[5].status === "fulfilled"
      ? results[5].value
      : ({ status: "unavailable" } as const);
  const storeList = results[6].status === "fulfilled" ? results[6].value : [];
  const warehouseList = results[7].status === "fulfilled" ? results[7].value : [];
  const currentStore = results[8].status === "fulfilled" ? results[8].value : undefined;
  // hasPackagingStock() already fails closed (returns false) on error, so the
  // allSettled rejection branch below is only a defensive backstop — it
  // should never actually trigger.
  const hasPackaging = results[9].status === "fulfilled" ? results[9].value : false;

  // ── Per-destination entitlement gate ──────────────────────────────
  //
  // Each entity's subscription expires SEPARATELY, but the middleware gate reads the JWT's
  // subscription_status claim, which Auth caches per BUSINESS
  // (auth:subscription:status:{businessId}) — there is no location dimension in it at all.
  // So on a business with two locations where one is still paid, an expired or cancelled
  // location stayed fully accessible: the business reads ACTIVE, and nothing else checked.
  //
  // EntitlementResponse.items is the per-entity truth. Note the shape: the Billing Service
  // builds items from ACTIVE + PAST_DUE only, so a lapsed entity is ABSENT rather than present
  // with active:false — except a bundled entity under a lapsed parent, which IS present with
  // active:false. `some(entitled && active)` covers both.
  //
  // Fails CLOSED when there is no trustworthy answer (billing unreachable and either no
  // snapshot or one stale beyond GRACE_MS) — see decideDestinationAccess (lib/entitlements/gate.ts)
  // for the full decision table and why a billing outage must no longer unlock everyone.
  const activeDestinationId =
    currentStore?.id ?? currentWarehouse?.id ?? currentLocation?.id;
  const gate = decideDestinationAccess(entitlementSnapshot, activeDestinationId);
  const entitlements =
    entitlementSnapshot.status === "unavailable" ? null : entitlementSnapshot.data;

  // Billing has to stay reachable, or a locked destination is a dead end. Destination pickers
  // too — the owner's other locations may be perfectly fine and they need a way back to them.
  // Only the final NextResponse.next() forwards this. If it is absent for any reason we cannot
  // tell whether we are already ON /billing — and redirecting there unconditionally would loop.
  // Absent header therefore means "don't lock".
  const pathname = (await headers()).get("x-pathname");
  const isEscapeHatch =
    !pathname ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/select-location") ||
    pathname.startsWith("/select-business") ||
    pathname.startsWith("/subscription");

  // Land them on the billing screen rather than blocking in place. Two reasons: the owner needs
  // somewhere they can actually pay from, and they may well want to pay LATER — the sidebar and
  // destination switcher stay available there (the business itself is fine), so they can carry on
  // in another location and come back to settle this one whenever they choose.
  // `isEntitlementGatingConfigured()` guards against locking every user out when
  // BILLING_SERVICE_URL is simply unset (local dev, or a deploy that dropped the config key) —
  // that is a misconfiguration signal, not a billing outage, and getEntitlementSnapshot already
  // logs it loudly via console.error. A real outage still locks: this only short-circuits the
  // "not configured at all" case.
  if (gate.outcome === "lock" && !isEscapeHatch && isEntitlementGatingConfigured()) {
    const lockedType = currentStore?.id
      ? "store"
      : currentWarehouse?.id
        ? "warehouse"
        : "location";
    // `reason` distinguishes "this entity's subscription lapsed" from "we could not reach
    // billing and have no trustworthy answer", so the billing page can explain which it is
    // rather than telling a paying customer their subscription expired.
    redirect(`/billing?expired=${lockedType}&reason=${gate.reason}`);
  }

  const locationCount = locationList?.length ?? 0;
  const storeCount = storeList?.length ?? 0;
  const warehouseCount = warehouseList?.length ?? 0;
  const hasMultipleDestinations =
    locationCount + storeCount + warehouseCount > 1;

  const businessData: BusinessPropsType = {
    business: currentBusiness,
    businessList: businessList || [],
    locationList: locationList || [],
    currentLocation: currentLocation,
    storeList: storeList || [],
    currentStore: currentStore,
    warehouseList: warehouseList || [],
    warehouse: currentWarehouse,
    hasMultipleDestinations,
  };

  // ── Expired / cancelled: minimal layout ───────────────────────────
  if (isSubscriptionDead) {
    return (
      <EntitlementProvider initialEntitlements={entitlements}>
        <div className="flex h-screen flex-col bg-canvas">
          {authToken?.impersonating && (
            <ImpersonationBanner email={authToken.email} />
          )}
          <ExpiredTopBar
            businessName={currentBusiness?.name}
            locationName={currentLocation?.name}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <Toaster />
        </div>
      </EntitlementProvider>
    );
  }

  // Build the user object once at the layout level so the sidebar
  // (and anything else that needs it) doesn't have to do the auth-token
  // → user reshape on every render. Mirrors what the old Header did.
  //
  // Identity (name/avatar/phone) comes from `/me/profile`, NOT the cookie: an
  // invited member or dashboard-staff user resolves to the owner's account, so
  // the cookie's profile fields are the account HOLDER's. Falls back to the
  // cookie when that call is unavailable.
  const identity = authToken ? await getMyDisplayIdentity() : null;
  const user: ExtendedUser | null = authToken
    ? ({
        id: authToken.userId,
        name: `${identity?.firstName ?? ""} ${identity?.lastName ?? ""}`.trim(),
        email: authToken.email,
        firstName: identity?.firstName ?? "",
        lastName: identity?.lastName ?? "",
        avatar: identity?.pictureUrl ?? null,
        phoneNumber: identity?.phoneNumber ?? "",
        emailVerified: authToken.emailVerified ? new Date() : null,
        isBusinessRegistrationComplete:
          authToken.isBusinessRegistrationComplete,
        isLocationRegistrationComplete:
          authToken.isLocationRegistrationComplete,
        accountId: authToken.accountId,
        countryId: authToken.countryId,
        countryCode: authToken.countryCode,
        theme: authToken.theme,
      } as ExtendedUser)
    : null;

  // Permission keys for client-side nav gating — resolved server-side from /me
  // (above). When /me is unavailable for a logged-in caller we fail OPEN (grant
  // all) via PermissionsProvider rather than read the token: post-slim the token
  // carries `perm_ids` (ints the browser can't resolve without the catalog) plus
  // only residual strings, so a token read under-reports and would wrongly HIDE
  // owner nav. UX-only — the backend @PreAuthorize is the real gate — so
  // fail-open on a transient outage is the safe failure (matches hasReportsReadAll).
  const mePermissions = await permissionsPromise;
  const permissionsUnavailable = !!authToken?.accessToken && mePermissions === null;
  const permissions = mePermissions ?? [];

  // Location-wide reports gate — resolved from /me (shares the call above),
  // not the retired JWT permissions claim.
  const reportsReadAll = await hasReportsReadAll();

  // ── Active subscription: full dashboard layout ────────────────────
  // The redesigned shell drops the topbar entirely. The floating
  // sidebar (logo + search + bell + biz/location switchers + nav +
  // user card) is the only chrome on the canvas. Page chrome
  // (breadcrumbs, title, actions) lives inside each page via
  // `<PageShell>` — see components/layouts/page-shell.tsx.
  return (
    <AppNotificationProviders>
      <EntitlementProvider initialEntitlements={entitlements}>
        <PermissionsProvider initialPermissions={permissions} failOpen={permissionsUnavailable}>
        <LoadingBarProvider>
          <SidebarProvider>
            <div className="flex h-screen flex-col overflow-hidden bg-canvas">
              {authToken?.impersonating && (
                <ImpersonationBanner email={authToken.email} />
              )}
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <DashboardSidebarShell
                  data={businessData}
                  user={user}
                  reportsReadAll={reportsReadAll}
                  hasPackaging={hasPackaging}
                />

                <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
                  {/* Mobile-only top bar (hamburger + logo). Lives here
                      instead of as a fixed-positioned floater so page
                      content keeps the full mobile width — the old
                      floater forced every PageShell to add `pl-14` on
                      mobile, which pushed everything right. */}
                  <MobileTopBar />

                  <div className="relative flex-1 overflow-y-auto">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                          </div>
                        </div>
                      }
                    >
                      {children}
                    </Suspense>
                  </div>

                  <div className="sticky bottom-0 z-[110]">
                    <Toaster />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </LoadingBarProvider>
        </PermissionsProvider>
      </EntitlementProvider>
      <WhatsAppButton
        businessName={currentBusiness?.name}
        locationName={currentLocation?.name}
        hideOnReserve
        className="lg:left-[320px]"
      />
      {currentLocation?.id && (
        <DaySessionWidget locationId={currentLocation.id} />
      )}
      {(currentLocation?.id || currentBusiness?.id) && (
        <SettloRealtimeListener
          channels={[
            ...(currentLocation?.id
              ? [`location:${currentLocation.id}:inventory`]
              : []),
            ...(currentBusiness?.id
              ? [`business:${currentBusiness.id}:customers`]
              : []),
          ]}
        />
      )}
      <StockCacheRealtimeBinder locationId={currentLocation?.id} />
      <CustomerCacheRealtimeBinder businessId={currentBusiness?.id} />
      <NotificationRealtimeBridge businessId={currentBusiness?.id} />
      <BuildPill />
    </AppNotificationProviders>
  );
}
