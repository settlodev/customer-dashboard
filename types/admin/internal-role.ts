export type AssignableAs = "SALES" | "SUPPORT" | "" | null;

export interface InternalRoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** SALES | SUPPORT | null — account assignment eligibility. */
  assignableAs: string | null;
  /** System roles are locked: cannot be edited or deactivated. */
  systemRole: boolean;
  active: boolean;
  permissions: string[];
  createdAt: string;
}

export interface CreateInternalRoleRequest {
  code: string;
  name: string;
  description?: string;
  assignableAs?: string;
  permissions: string[];
}

export interface UpdateInternalRoleDefinitionRequest {
  name: string;
  description?: string;
  assignableAs?: string;
  permissions: string[];
  active?: boolean;
}
