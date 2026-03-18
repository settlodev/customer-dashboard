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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let currentBusiness, currentLocation, businessList, locationList, currentWarehouse;
  try {
    [currentBusiness, currentLocation, businessList, locationList, currentWarehouse] =
      await Promise.all([
        getCurrentBusiness(),
        getCurrentLocation(),
        getBusinessDropDown(),
        fetchAllLocations(),
        getCurrentWarehouse(),
      ]);
  } catch (error: unknown) {
    const message = (error && typeof error === "object" && "message" in error)
      ? (error as { message: string }).message
      : "Unknown error";
    console.error("Error loading layout data:", message);
  }

  const businessData = {
    business: currentBusiness ?? null,
    businessList: businessList || [],
    locationList: locationList || [],
    currentLocation: currentLocation ?? null,
    warehouse: currentWarehouse ?? null,
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
