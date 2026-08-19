import React from "react";

import { AdminSidebarShell } from "@/components/sidebar/admin-sidebar";
import { AuthToken } from "@/types/types";

interface AdminShellProps {
  token: AuthToken | null;
  children: React.ReactNode;
}

export function AdminShell({ token, children }: AdminShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <AdminSidebarShell token={token} />
      <main className="flex flex-1 min-w-0 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
