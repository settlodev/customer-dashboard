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
import { BusinessPropsType } from "@/types/business/business-props-type";
import { Business } from "@/types/business/type";
import { Location as BusinessLocation } from "@/types/location/type";
import { getAuthToken } from "@/lib/auth-utils";
import { SubscriptionProvider } from "@/context/subscriptionContext";
import { EntitlementProvider } from "@/context/entitlementContext";
import { getEntitlements } from "@/lib/actions/entitlement-actions";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authToken = await getAuthToken();

  let currentBusiness: Business | undefined;
  let currentLocation: BusinessLocation | undefined;
  let businessList: Business[] | undefined;
  let locationList: BusinessLocation[] | null | undefined;
  let currentWarehouse: any;
  let entitlements: Awaited<ReturnType<typeof getEntitlements>> = null;

  // Use allSettled so a single failed call (e.g., expired token) doesn't
  // crash the entire layout. Each result is handled independently.
  const results = await Promise.allSettled([
    getCurrentBusiness(),
    getCurrentLocation(),
    getBusinessDropDown(),
    fetchAllLocations(),
    getCurrentWarehouse(),
    getEntitlements(),
  ]);
  currentBusiness = results[0].status === "fulfilled" ? results[0].value ?? undefined : undefined;
  currentLocation = results[1].status === "fulfilled" ? results[1].value ?? undefined : undefined;
  businessList = results[2].status === "fulfilled" ? results[2].value ?? undefined : undefined;
  locationList = results[3].status === "fulfilled" ? results[3].value : undefined;
  currentWarehouse = results[4].status === "fulfilled" ? results[4].value : undefined;
  entitlements = results[5].status === "fulfilled" ? results[5].value : null;

  const businessData: BusinessPropsType = {
    business: currentBusiness,
    businessList: businessList || [],
    locationList: locationList || [],
    currentLocation: currentLocation,
    warehouse: currentWarehouse,
  };

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <SubscriptionProvider initialStatus={authToken?.subscriptionStatus ?? null}>
      <EntitlementProvider initialEntitlements={entitlements}>
      <LoadingBarProvider>
        <div className="flex h-screen overflow-hidden bg-primary-light dark:bg-gray-950">
          <SidebarWrapper data={businessData} />

          <main className="flex h-screen flex-1 min-w-0 flex-col overflow-hidden">
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

            <div className="sticky bottom-0 z-10">
              <Toaster />
            </div>
          </main>
        </div>
      </LoadingBarProvider>
      </EntitlementProvider>
      </SubscriptionProvider>
    </SessionProvider>
  );
}
