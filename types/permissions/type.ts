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
