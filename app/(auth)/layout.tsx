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
            <div className="relative flex flex-col min-h-screen">
                {/* Background gradient */}
                <div className="fixed inset-0 bg-gradient-to-b from-primary-light via-white to-primary-light dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(235,127,68,0.08),transparent_50%)]" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(235,127,68,0.06),transparent_50%)]" />

                <div className="relative z-10 flex flex-col min-h-screen">
                    <LoggedOutNavbar hideLogin={true} />

                    <main className="flex-grow flex items-center">
                        <div className="w-full lg:container lg:mx-auto lg:px-28 px-4 py-12">
                            {children}
                        </div>
                    </main>

                    <Footer />
                </div>
            </div>
        </SessionProvider>
    )
}
