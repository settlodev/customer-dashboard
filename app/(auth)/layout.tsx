import React from "react";
import {auth} from "@/auth";
import {SessionProvider} from "next-auth/react";
import {LoggedOutNavbar} from "@/components/navigation/logged-out-user-nav";
import {Footer} from "@/components/landing-page/Footer";

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <SessionProvider session={session}>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <LoggedOutNavbar hideLogin={true} />

                <main className="flex-grow flex items-center">
                    <div className="w-full lg:container lg:mx-auto lg:px-28 px-4 py-12">
                        {children}
                    </div>
                </main>

                <Footer />
            </div>
        </SessionProvider>
    )
}
