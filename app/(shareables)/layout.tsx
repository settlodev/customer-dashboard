import type { Metadata } from "next";
import React from "react";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Settlo Technologies",
  description: "Kesho yako ni kubwa",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShareablesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider session={null}>
      <div className="min-h-screen bg-slate-100 print:bg-white">{children}</div>
    </SessionProvider>
  );
}
