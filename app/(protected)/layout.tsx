import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { NavbarWrapper } from "@/components/navigation/navbar-wrapper";
import { SidebarWrapper } from "@/components/sidebar/sidebar";
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

  // ── Active subscription: full dashboard layout ────────────────────
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <EntitlementProvider initialEntitlements={entitlements}>
      <LoadingBarProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-primary-light dark:bg-gray-950">
          <SubscriptionBanner />
          <div className="flex flex-1 min-h-0 overflow-hidden">
          <SidebarWrapper data={businessData} />

          <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <div className="relative flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-full">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                }
              >
                <NavbarWrapper session={null} authToken={authToken} businessData={businessData}>
                  <div className="flex-1">{children}</div>
                </NavbarWrapper>
              </Suspense>
            </div>

            <div className="sticky bottom-0 z-[110]">
              <Toaster />
            </div>
          </main>
          </div>
        </div>
      </LoadingBarProvider>
      </EntitlementProvider>
    </SessionProvider>
  );
}
