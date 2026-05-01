import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
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
import { BusinessPropsType } from "@/types/business/business-props-type";
import { getAuthToken } from "@/lib/auth-utils";
import { EntitlementProvider } from "@/context/entitlementContext";
import { getEntitlements } from "@/lib/actions/entitlement-actions";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { ExpiredTopBar } from "@/components/subscription/ExpiredTopBar";
import { fetchAllStores, getCurrentStore } from "@/lib/actions/store-actions";
import WhatsAppButton from "@/components/whatsapp-button";
import { DaySessionWidget } from "@/components/widgets/day-session-widget";
import { BuildPill } from "@/components/widgets/build-pill";
import type { ExtendedUser } from "@/types/types";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authToken = await getAuthToken();

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
    getEntitlements(),
    fetchAllStores(),
    searchWarehouses(),
    getCurrentStore(),
  ]);

  const currentBusiness = results[0].status === "fulfilled" ? results[0].value ?? undefined : undefined;
  const currentLocation = results[1].status === "fulfilled" ? results[1].value ?? undefined : undefined;
  const businessList = results[2].status === "fulfilled" ? results[2].value ?? undefined : undefined;
  const locationList = results[3].status === "fulfilled" ? results[3].value : undefined;
  const currentWarehouse = results[4].status === "fulfilled" ? results[4].value : undefined;
  const entitlements = results[5].status === "fulfilled" ? results[5].value : null;
  const storeList = results[6].status === "fulfilled" ? results[6].value : [];
  const warehouseList = results[7].status === "fulfilled" ? results[7].value : [];
  const currentStore = results[8].status === "fulfilled" ? results[8].value : undefined;

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
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        <EntitlementProvider initialEntitlements={entitlements}>
          <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
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
      </SessionProvider>
    );
  }

  // Build the user object once at the layout level so the sidebar
  // (and anything else that needs it) doesn't have to do the auth-token
  // → user reshape on every render. Mirrors what the old Header did.
  const user: ExtendedUser | null = authToken
    ? ({
        id: authToken.userId,
        name: `${authToken.firstName} ${authToken.lastName}`.trim(),
        email: authToken.email,
        firstName: authToken.firstName,
        lastName: authToken.lastName,
        avatar: authToken.pictureUrl,
        phoneNumber: authToken.phoneNumber,
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

  // ── Active subscription: full dashboard layout ────────────────────
  // The redesigned shell drops the topbar entirely. The floating
  // sidebar (logo + search + bell + biz/location switchers + nav +
  // user card) is the only chrome on the canvas. Page chrome
  // (breadcrumbs, title, actions) lives inside each page via
  // `<PageShell>` — see components/layouts/page-shell.tsx.
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <EntitlementProvider initialEntitlements={entitlements}>
        <LoadingBarProvider>
          <SidebarProvider>
            <div className="flex h-screen flex-col overflow-hidden bg-canvas dark:bg-gray-950">
              <SubscriptionBanner />
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <DashboardSidebarShell data={businessData} user={user} />

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
      </EntitlementProvider>
      <WhatsAppButton
        businessName={currentBusiness?.name}
        locationName={currentLocation?.name}
        hideOnReserve
      />
      {currentLocation?.id && (
        <DaySessionWidget locationId={currentLocation.id} />
      )}
      <BuildPill />
    </SessionProvider>
  );
}
