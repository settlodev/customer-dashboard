"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PermissionKey } from "@/types/permissions/type";

interface PermissionsContextType {
  permissions: PermissionKey[];
  loading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function PermissionsProvider({
  children,
  initialPermissions = [],
  failOpen = false,
}: {
  children: React.ReactNode;
  initialPermissions?: PermissionKey[];
  /**
   * The permission source (`/me`) was unavailable, so we can't know the caller's
   * keys. Grant-all for client gating — it's UX-only (the backend @PreAuthorize
   * is the real gate), and hiding owner nav/actions on a transient outage is the
   * worse failure. Set by the layout only when a logged-in caller's `/me` fetch
   * failed. Note the token is NOT a usable fallback: post-slim it carries
   * `perm_ids` (ints the browser can't resolve without the catalog) plus only
   * residual strings, so reading it would under-report and wrongly fail closed.
   */
  failOpen?: boolean;
}) {
  const [permissions, setPermissions] = useState<PermissionKey[]>(initialPermissions);
  const [loading, setLoading] = useState(!failOpen && !initialPermissions.length);

  useEffect(() => {
    if (initialPermissions.length > 0) {
      setPermissions(initialPermissions);
      setLoading(false);
    }
  }, [initialPermissions]);

  const hasPermission = useCallback(
    (key: PermissionKey) => failOpen || permissions.includes(key),
    [permissions, failOpen],
  );

  const hasAnyPermission = useCallback(
    (keys: PermissionKey[]) => failOpen || keys.some((key) => permissions.includes(key)),
    [permissions, failOpen],
  );

  const hasAllPermissions = useCallback(
    (keys: PermissionKey[]) => failOpen || keys.every((key) => permissions.includes(key)),
    [permissions, failOpen],
  );

  return (
    <PermissionsContext.Provider
      value={{ permissions, loading, hasPermission, hasAnyPermission, hasAllPermissions }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
