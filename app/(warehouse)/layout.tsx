import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar-wrapper";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { fetchAllStores, getCurrentStore } from "@/lib/actions/store-actions";
import type { BusinessPropsType } from "@/types/business/business-props-type";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    const results = await Promise.allSettled([
        getCurrentBusiness(),
        getCurrentLocation(),
        getBusinessDropDown(),
        fetchAllLocations(),
        getCurrentWarehouse(),
        fetchAllStores(),
        searchWarehouses(),
        getCurrentStore(),
    ]);

    const currentBusiness = results[0].status === "fulfilled" ? results[0].value ?? undefined : undefined;
    const currentLocation = results[1].status === "fulfilled" ? results[1].value ?? undefined : undefined;
    const businessList = results[2].status === "fulfilled" ? results[2].value ?? undefined : undefined;
    const locationList = results[3].status === "fulfilled" ? results[3].value : undefined;
    const currentWarehouse = results[4].status === "fulfilled" ? results[4].value : undefined;
    const storeList = results[5].status === "fulfilled" ? results[5].value : [];
    const warehouseList = results[6].status === "fulfilled" ? results[6].value : [];
    const currentStore = results[7].status === "fulfilled" ? results[7].value : undefined;

    const hasMultipleDestinations =
        (locationList?.length ?? 0) +
            (storeList?.length ?? 0) +
            (warehouseList?.length ?? 0) >
        1;

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
    }

    return (
        <SessionProvider session={session}>
            <div className="flex h-screen overflow-hidden bg-gray-200 dark:bg-gray-950">
                <SidebarWrapper data={businessData} menuType="warehouse"/>

                <main className="flex h-screen flex-1 min-w-0 flex-col overflow-hidden">
                    <div className="relative flex-1 overflow-y-auto bg-primary-light">
                        <Suspense fallback={"Loading"}>
                            <NavbarWrapper session={session} businessData={businessData} menuType="warehouse">
                                <div className="flex-1">{children}</div>
                            </NavbarWrapper>
                        </Suspense>
                    </div>

                    <div className="sticky bottom-0 z-[110]">
                        <Toaster/>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}
