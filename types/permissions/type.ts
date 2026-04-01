export interface Permission {
  id: string;
  key: string;
  description: string;
  category: string;
  system: boolean;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

// Permission keys follow the pattern: <resource>:<action>
// Examples: "businesses:create", "staff:read", "roles:update"
export type PermissionKey = string;
