import React from "react";
import { Toaster } from "@/components/ui/toaster";

// Every admin route is auth-gated and renders live data driven by URL search
// params; none should be statically cached or served from a prefetched
// (param-less) Router Cache entry. Forcing dynamic at the layout covers all
// admin pages — so search-param-driven lists (accounts, businesses, …) always
// re-render with the current params instead of ignoring paging/sort/filter/search.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      {children}
      <Toaster />
    </div>
  );
}
