export type InternalUserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION"
  | "LOCKED";

/** A held role's code and display name. */
export interface RoleSummary {
  code: string;
  name: string;
}

export interface InternalUserResponse {
  id: string;
  email: string;
  /** Every role (system or custom) this staff member currently holds. */
  roles: RoleSummary[];
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
  /** Role CODEs — one or more, system or custom/dynamic. */
  roles: string[];
}

export interface UpdateInternalRolesRequest {
  /** Role CODEs — fully replaces the user's current role set. */
  roles: string[];
}

export interface RolePermissionsResponse {
  /** Role CODE — a system role or a custom/dynamic role code. */
  role: string;
  /** Human-readable role name for display. */
  name: string;
  description: string | null;
  permissions: string[];
}
