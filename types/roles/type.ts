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

// Names of system roles the backend refuses to modify or delete. Owner is the
// top-level grant; Location Manager is looked up by name when provisioning
// owner assignments on new locations, so renaming or deleting it breaks
// onboarding.
export const PROTECTED_ROLE_NAMES = ["Owner", "Location Manager"] as const;

export function isProtectedRole(role: Pick<Role, "name" | "system">): boolean {
  return role.system && (PROTECTED_ROLE_NAMES as readonly string[]).includes(role.name);
}
