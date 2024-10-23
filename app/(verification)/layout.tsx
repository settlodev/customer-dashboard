import "@/styles/globals.css";
import {auth} from "@/auth";
import {SessionProvider} from "next-auth/react";
import {Providers} from "@/app/providers";
export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    return (<SessionProvider session={session}>
            <Providers>{children}</Providers>
        </SessionProvider>
    )
}
