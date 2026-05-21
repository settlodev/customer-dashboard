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
  internalRole: InternalRole;
  status: InternalUserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateInternalUserRequest {
  email: string;
  password: string;
  role: InternalRole;
}

export interface UpdateInternalRoleRequest {
  role: InternalRole;
}

export interface RolePermissionsResponse {
  role: InternalRole;
  description: string;
  permissions: string[];
}
