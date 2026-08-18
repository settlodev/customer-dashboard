import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar-wrapper";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import WhatsAppButton from "@/components/whatsapp-button";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { fetchAllStores, getCurrentStore } from "@/lib/actions/store-actions";
import { SettloRealtimeListener } from "@/components/realtime/settlo-realtime-listener";
import { AppNotificationProviders } from "@/components/providers/app-notification-providers";
import type { BusinessPropsType } from "@/types/business/business-props-type";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEntitlementSnapshot, isEntitlementGatingConfigured } from "@/lib/entitlements/snapshot";
import { decideDestinationAccess } from "@/lib/entitlements/gate";

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
        getEntitlementSnapshot(),
    ]);

    const currentBusiness = results[0].status === "fulfilled" ? results[0].value ?? undefined : undefined;
    const currentLocation = results[1].status === "fulfilled" ? results[1].value ?? undefined : undefined;
    const businessList = results[2].status === "fulfilled" ? results[2].value ?? undefined : undefined;
    const locationList = results[3].status === "fulfilled" ? results[3].value : undefined;
    const currentWarehouse = results[4].status === "fulfilled" ? results[4].value : undefined;
    const storeList = results[5].status === "fulfilled" ? results[5].value : [];
    const warehouseList = results[6].status === "fulfilled" ? results[6].value : [];
    const currentStore = results[7].status === "fulfilled" ? results[7].value : undefined;
    const entitlementSnapshot =
        results[8].status === "fulfilled"
            ? results[8].value
            : ({ status: "unavailable" } as const);

    // ── Per-destination entitlement gate ──────────────────────────────
    //
    // Mirrors app/(protected)/layout.tsx — see there for the full rationale on
    // decideDestinationAccess and the fail-CLOSED behaviour when billing has no
    // trustworthy answer. This group is warehouse-only, so the warehouse itself is
    // the destination being judged (not store/location as in the protected layout).
    const activeWarehouseId = currentWarehouse?.id;
    const gate = decideDestinationAccess(
        entitlementSnapshot,
        activeWarehouseId,
        currentBusiness?.id,
    );

    // Billing has to stay reachable, or a locked warehouse is a dead end. Only the final
    // NextResponse.next() forwards x-pathname. If it is absent for any reason we cannot tell
    // whether redirecting would loop, so — same as app/(protected)/layout.tsx — absent header
    // means "don't lock". Unlike that layout, this group has no escape-hatch routes of its own:
    // /billing, /select-location, /select-business, and /subscription all live in the
    // (protected) group, entirely outside this layout, so the redirect below always exits it —
    // there is nothing here to loop back into.
    const pathname = (await headers()).get("x-pathname");

    // Land them on the billing screen rather than blocking in place — same reasoning as the
    // protected layout: it's somewhere they can actually pay from, and the sidebar/destination
    // switcher stay available there. `isEntitlementGatingConfigured()` guards against locking
    // everyone out when BILLING_SERVICE_URL is simply unset (local dev / misconfigured deploy)
    // rather than a real outage.
    if (gate.outcome === "lock" && pathname && isEntitlementGatingConfigured()) {
        redirect(`/billing?expired=warehouse&reason=${gate.reason}`);
    }

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
            <AppNotificationProviders>
            <div className="flex h-screen overflow-hidden bg-canvas">
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
            <WhatsAppButton
                userName={session?.user?.name ?? undefined}
                businessName={currentBusiness?.name}
                locationName={currentLocation?.name}
                hideOnReserve
            />
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
            </AppNotificationProviders>
        </SessionProvider>
    );
}
