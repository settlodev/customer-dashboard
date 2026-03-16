import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Book a Reservation | Settlo",
  description: "Book a table reservation online",
};

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
