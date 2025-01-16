import type { Metadata } from "next";
import "./globals.css";
import {SessionProvider} from "next-auth/react";
import {Providers} from "./providers";
import {auth} from "@/auth";
import React from "react";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
    applicationName: "Settlo",
    title: "Settlo Customer Dashboard",
    description: "Settlo Customer Dashboard",
    generator: "Settlo",
    icons: {
        icon: "/favicon.png",
    },
};

export default async function RootLayout({children,}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
      <html lang="en" className="bg-whiten" suppressHydrationWarning={true}>
        <body className='antialiased bg-whiten dark:bg-boxdark-2 dark:text-bodydark'>
          <SessionProvider session={session}>
              <Providers>{children}</Providers>
          </SessionProvider>
          <Analytics />
        </body>
      </html>
  );
}
