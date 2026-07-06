import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Settlo Technologies",
  description: "Kesho yako ni kubwa",
  robots: {
    index: false,
    follow: false,
  },
};

// Authenticated, chrome-free print views (opened in a new tab from detail
// pages). Middleware's default-deny keeps everything here behind login —
// only routes listed in `publicRoutes` skip auth. Same rationale as
// (protected)/layout.tsx for force-dynamic: every page resolves identity
// from cookies, so nothing here can be statically prerendered.
export const dynamic = "force-dynamic";

export default function PrintablesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">{children}</div>
  );
}
