import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar-wrapper";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { Business } from "@/types/business/type";
import { Location as BusinessLocation } from "@/types/location/type";

export default async function RootLayout({children}: {
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

    const businessData = {
        business: currentBusiness,
        businessList: businessList || [],
        locationList: locationList || [],
        currentLocation: currentLocation,
        warehouse: currentWarehouse,
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

                    <div className="sticky bottom-0 z-10">
                        <Toaster/>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}
