import { InternalRole } from "@/types/types";

export type InternalUserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION"
  | "LOCKED";

export interface InternalUserResponse {
  id: string;
  email: string;
  /** Legacy enum — null for holders of a custom (dynamic) role. */
  internalRole: InternalRole | null;
  /** Canonical role code (system or custom) — present for every internal user. */
  roleCode: string | null;
  /** Human-readable role name from the role manager. */
  roleName: string | null;
  status: InternalUserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  /**
   * Only set on the create-internal-user response: true if this email already belonged to a
   * user (e.g. signed up through the normal customer-facing flow) and was promoted in place
   * rather than created fresh. Undefined/null on every other response using this shape.
   */
  promoted?: boolean | null;
}

export interface CreateInternalUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Role CODE — system or custom/dynamic. */
  role: string;
}

export interface UpdateInternalRoleRequest {
  /** Role CODE — system or custom/dynamic. */
  role: string;
}

export interface RolePermissionsResponse {
  /** Role CODE — a system role or a custom/dynamic role code. */
  role: string;
  /** Human-readable role name for display. */
  name: string;
  description: string | null;
  permissions: string[];
}
