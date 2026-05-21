import React from "react";
import { Toaster } from "@/components/ui/toaster";

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
