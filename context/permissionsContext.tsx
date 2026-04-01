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
}: {
  children: React.ReactNode;
  initialPermissions?: PermissionKey[];
}) {
  const [permissions, setPermissions] = useState<PermissionKey[]>(initialPermissions);
  const [loading, setLoading] = useState(!initialPermissions.length);

  useEffect(() => {
    if (initialPermissions.length > 0) {
      setPermissions(initialPermissions);
      setLoading(false);
    }
  }, [initialPermissions]);

  const hasPermission = useCallback(
    (key: PermissionKey) => permissions.includes(key),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (keys: PermissionKey[]) => keys.some((key) => permissions.includes(key)),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (keys: PermissionKey[]) => keys.every((key) => permissions.includes(key)),
    [permissions],
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
