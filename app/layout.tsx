import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import {SessionProvider} from "next-auth/react";
import {Providers} from "./providers";
import {auth} from "@/auth";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Settlo Customer Dashboard",
  description: "Customer dashboard",
};

export default async function RootLayout({
                                           children,
                                         }: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  console.log("my session is:", session);
  return (
      <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <SessionProvider session={session}>
        <Providers>{children}</Providers>
      </SessionProvider>
      </body>
      </html>
  );
}
