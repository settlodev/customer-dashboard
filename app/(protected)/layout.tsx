import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getBusinessDropDown, getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import {NavbarWrapper} from "@/components/navbar/navbar";
import {listLocations} from "@/lib/actions/business/list-locations";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const  currentBusiness = await getCurrentBusiness();
    const  currentLocation = await getCurrentLocation();
    const  businessList = await getBusinessDropDown();
    const locationList = currentBusiness?await listLocations():[];
    const businessData = {
        "business": currentBusiness,
        "businessList": businessList,
        "locationList": locationList,
        "currentLocation": currentLocation
    }
    return (
        <SessionProvider session={session}>
            <div className="flex">
                <SidebarWrapper data={businessData}/>
                <NavbarWrapper data={session}>
                    {children}
                    <Toaster/>
                </NavbarWrapper>
            </div>
        </SessionProvider>
    );
}
