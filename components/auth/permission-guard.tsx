"use client";

import { usePermissions } from "@/context/permissionsContext";
import { PermissionKey } from "@/types/permissions/type";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) return null;

  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}
