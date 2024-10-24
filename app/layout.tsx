import type { Metadata } from "next";
import "./globals.css";
import {SessionProvider} from "next-auth/react";
import {Providers} from "./providers";
import {auth} from "@/auth";

export const metadata: Metadata = {
  title: "Settlo Customer Dashboard",
  description: "Customer dashboard",
};

export default async function RootLayout({children,}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
      <html lang="en" className="bg-whiten">
      <head>
          <link rel="icon" href="/favicon.png" sizes="any"/>
      </head>

      <body className='antialiased bg-whiten dark:bg-boxdark-2 dark:text-bodydark'>
      <SessionProvider session={session}>
        <Providers>{children}</Providers>
      </SessionProvider>
      </body>
      </html>
  );
}
