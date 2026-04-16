// ---------------------------------------------------------------------------
// Role scope — determines where the role applies
// ---------------------------------------------------------------------------

export enum RoleScope {
  ACCOUNT = "ACCOUNT",
  BUSINESS = "BUSINESS",
  LOCATION = "LOCATION",
  STORE = "STORE",
  WAREHOUSE = "WAREHOUSE",
}

// ---------------------------------------------------------------------------
// Role (matches RoleResponse from Accounts Service)
// ---------------------------------------------------------------------------

export interface Role {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  scopeId: string | null;
  system: boolean;
  permissionKeys: string[];
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}
