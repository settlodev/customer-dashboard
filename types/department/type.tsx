// ---------------------------------------------------------------------------
// Department (matches DepartmentResponse from Accounts Service)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  accountId: string;
  locationId: string;
  identifier: string;
  name: string;
  description: string | null;
  color: string | null;
  image: string | null;
  active: boolean;
  /**
   * Auto-created with each location and protected from delete / archive
   * server-side. Dashboard surfaces a "Default" badge and disables the
   * Archive action when this is true.
   */
  isDefault: boolean;
  order: number | null;
  defaultPosView: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Department count
// ---------------------------------------------------------------------------

export interface DepartmentCount {
  total: number;
  active: number;
  inactive: number;
}
