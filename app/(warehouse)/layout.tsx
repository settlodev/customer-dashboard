import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { NavbarWrapper } from "@/components/navigation/navbar-wrapper";
import { SidebarWrapper } from "@/components/sidebar/sidebar";
import {
  getBusinessDropDown,
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { Business } from "@/types/business/type";
import { Location as BusinessLocation } from "@/types/location/type";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { BusinessPropsType } from "@/types/business/business-props-type";

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
  let currentWarehouse: Warehouses | undefined; // ✅ typed, was: any
  let warehouseList: Warehouses[] = []; // ✅ new

  try {
    // ✅ Core data — parallel, equally critical
    const [
      resolvedBusiness,
      resolvedLocation,
      resolvedBusinessList,
      resolvedLocationList,
    ] = await Promise.all([
      getCurrentBusiness(),
      getCurrentLocation(),
      getBusinessDropDown(),
      fetchAllLocations(),
    ]);

    currentBusiness = resolvedBusiness ?? undefined;
    currentLocation = resolvedLocation ?? undefined;
    businessList = resolvedBusinessList ?? undefined;
    locationList = resolvedLocationList;

    // ✅ Isolated — failure won't poison core data
    currentWarehouse = await getCurrentWarehouse().catch(() => undefined);

    // ✅ Gated — only fetch if business exists
    if (currentBusiness?.id) {
      warehouseList = await searchWarehouses("", 0, 20)
        .then((r) => r?.content ?? [])
        .catch(() => []);
    }
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "Unknown error";
    console.error("Error loading warehouse layout data:", message);
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
      <div className="flex h-screen overflow-hidden bg-gray-200 dark:bg-gray-950">
        <SidebarWrapper data={businessData} menuType="warehouse" />

        <main className="flex h-screen flex-1 min-w-0 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-y-auto bg-primary-light">
            <Suspense fallback="Loading">
              <NavbarWrapper
                session={session}
                businessData={businessData}
                menuType="warehouse"
                warehouseList={warehouseList} // ✅ new
              >
                <div className="flex-1">{children}</div>
              </NavbarWrapper>
            </Suspense>
          </div>

          <div className="sticky bottom-0 z-10">
            <Toaster />
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
