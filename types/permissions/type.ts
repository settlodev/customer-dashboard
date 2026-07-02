// ---------------------------------------------------------------------------
// Permission (matches PermissionResponse from Accounts Service)
// ---------------------------------------------------------------------------

export interface Permission {
  id: string;
  accountId: string;
  key: string;
  name: string;
  description: string | null;
  system: boolean;
  category: string;
  // High-level domain the permission belongs to (e.g. "Point of Sale",
  // "Inventory", "Accounting"). Computed by the Accounts Service from the
  // catalog list that defines the key. May be absent on responses served
  // before the backend was updated — treat missing as "Other".
  group?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Permission list response (grouped by category)
// ---------------------------------------------------------------------------

export interface PermissionListResponse {
  totalCount: number;
  byCategory: Record<string, Permission[]>;
  all: Permission[];
}

// Permission keys follow the pattern: <resource>:<action>
export type PermissionKey = string;
