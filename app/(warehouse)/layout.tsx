import React, {Suspense} from "react";
import { Toaster } from "@/components/ui/toaster"
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {NavbarWrapper} from "@/components/navigation/navbar-wrapper";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const  currentBusiness = await getCurrentBusiness();
    const  currentWarehouse = await getCurrentWarehouse();
    

    const businessData = {
        business: currentBusiness, 
        warehouse: currentWarehouse, 
    }

    return (
        <SessionProvider session={session}>
            <div className="flex h-screen w-full overflow-hidden">
                <SidebarWrapper data={businessData} menuType="warehouse"/>

                <main className="flex h-screen w-full flex-col overflow-hidden">
                    <div className="relative flex-1 overflow-y-auto">
                        <div className="flex min-h-full w-full flex-col gap-4">
                            <Suspense fallback={"Loading"}>
                                <NavbarWrapper session={session}>
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
