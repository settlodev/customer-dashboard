import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import {fetchAllLocations} from "@/lib/actions/location-actions";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const  currentBusiness = await getCurrentBusiness();
    const  currentLocation = await getCurrentLocation();
    const  businessList = await getBusinessDropDown();
    const locationList = await fetchAllLocations();

    const businessData = {
        "business": currentBusiness,
        "businessList": businessList,
        "locationList": locationList,
        "currentLocation": currentLocation
    }

    return (
        <SessionProvider session={session}>
            <div className="flex h-screen w-full overflow-hidden">
                <SidebarWrapper data={businessData}/>

                <main className="flex h-screen w-full flex-col overflow-hidden">
                    <div className="relative flex-1 overflow-y-auto">
                        <div className="flex min-h-full w-full flex-col gap-4">
                            <Suspense fallback={"Loading"}>
                                <NavbarWrapper data={session}>
                                    <div className="flex-1">{children}</div>
                                </NavbarWrapper>
                            </Suspense>
                        </div>
                    </div>

                    <div className="sticky bottom-0 z-10 w-full">
                        <Toaster/>
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}
