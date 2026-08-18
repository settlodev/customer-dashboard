export interface AuditLogEntry {
  id: string;
  userId: string | null;
  staffName: string | null;
  locationId: string | null;
  businessId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  ARCHIVE: "Archived",
  UNARCHIVE: "Unarchived",
  CONFIRM: "Confirmed",
  CANCEL: "Cancelled",
  DISPATCH: "Dispatched",
  RECEIVE: "Received",
  APPROVE: "Approved",
  REJECT: "Rejected",
  SUBMIT: "Submitted",
  SOFT_DELETE: "Soft-deleted",
};
