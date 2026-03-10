import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar-wrapper";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import {fetchAllLocations} from "@/lib/actions/location-actions";
import Loading from "../loading";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    
    const session = await auth();
    const currentBusiness = await getCurrentBusiness();
    const currentLocation = await getCurrentLocation();
    const businessList = await getBusinessDropDown();
    const locationList = await fetchAllLocations();
    const currentWarehouse = await getCurrentWarehouse();
    
   
    const businessData = {
        business: currentBusiness, 
        businessList: businessList || [],  
        locationList: locationList || [], 
        currentLocation: currentLocation, 
        currentWarehouse: currentWarehouse
    }

    

    return (
        <SessionProvider session={session}>
            <div className="flex h-screen overflow-hidden">
                <SidebarWrapper data={businessData}/>

                <main className="flex h-screen flex-1 min-w-0 flex-col overflow-hidden">
                    <div className="relative flex-1 overflow-y-auto bg-primary-light">
                        <Suspense fallback={
                            <div className="flex justify-center items-center h-full">
                                <Loading/>
                            </div>
                        }>
                            <NavbarWrapper session={session} businessData={businessData}>
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
