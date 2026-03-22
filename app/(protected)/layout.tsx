import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let currentBusiness: Business | undefined;
  let currentLocation: BusinessLocation | undefined;
  let businessList: Business[] | undefined;
  let locationList: BusinessLocation[] | null | undefined;
  let currentWarehouse: any;

  try {
    const results = await Promise.all([
      getCurrentBusiness(),
      getCurrentLocation(),
      getBusinessDropDown(),
      fetchAllLocations(),
      getCurrentWarehouse(),
    ]);
    currentBusiness = results[0] ?? undefined;
    currentLocation = results[1] ?? undefined;
    businessList = results[2] ?? undefined;
    locationList = results[3];
    currentWarehouse = results[4];
  } catch (error: unknown) {
    const message = (error && typeof error === "object" && "message" in error)
      ? (error as { message: string }).message
      : "Unknown error";
    console.error("Error loading layout data:", message);
  }

  const businessData: BusinessPropsType = {
    business: currentBusiness,
    businessList: businessList || [],
    locationList: locationList || [],
    currentLocation: currentLocation,
    warehouse: currentWarehouse,
  };

  return (
    <SessionProvider session={session}>
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
                <NavbarWrapper session={session} businessData={businessData}>
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
    </SessionProvider>
  );
}
