import { Toaster } from "@/components/ui/toaster"
import {Suspense} from "react";
import {SessionProvider} from "next-auth/react";
import {auth} from "@/auth";
import {SidebarWrapper} from "@/components/sidebar/sidebar";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const  currentBusiness = await getCurrentBusiness();

    return (
        <SessionProvider session={session}>
            <Suspense fallback={"Loading..."}>
                <div className="flex h-dvh w-full">
                    <SidebarWrapper business={currentBusiness} />
                    <div className="w-full flex-1 flex-col">
                        {children}
                        <Toaster />
                    </div>

                </div>
            </Suspense>
        </SessionProvider>
    );
    // return (<SessionProvider session={session}>
    //     <Suspense fallback={"Loading..."}>
    //         <LayoutTsx>
    //             {children}
    //             <Toaster />
    //         </LayoutTsx>
    //     </Suspense>
    // </SessionProvider>)

}
