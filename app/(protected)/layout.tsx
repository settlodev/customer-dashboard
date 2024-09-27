import { Toaster } from "@/components/ui/toaster"
import {Suspense} from "react";

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={"Loading..."}>
            <div className="flex h-dvh w-full">
                Sidebar
                <div className="w-full flex-1 flex-col">
                    <header className="flex rounded-medium">
                        Navbar
                    </header>

                    <main className="mt-2 max-h-full w-full overflow-visible">
                        <div className="flex h-[80%] w-full flex-col gap-4 rounded-small border-sma/ll border-divider">
                            {children}
                        </div>
                    </main>
                </div>
                <Toaster />
            </div>
        </Suspense>
    );
}
