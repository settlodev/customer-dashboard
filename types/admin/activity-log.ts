/**
 * Types for the system-admin client-activity log browser. Mirrors the OMS
 * `ClientActivityAdminRow` / `ClientActivityPage` DTOs returned by
 * `GET /api/v1/admin/client-activity` (internal-secret gated).
 */

/** One row of the OMS `client_activity` audit stream. */
export interface ClientActivityRow {
  /** Row id (UUID). */
  id: string;
  /** Per-device monotonic sequence number. */
  deviceSeq: number;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  /** Human order number, populated when targetId resolves to a known order. */
  orderNumber: string | null;
  staffId: string | null;
  locationId: string | null;
  /** Moment-of-intent wall clock on the device (ISO date-time). */
  clientTs: string;
  /** Server ingest time (ISO date-time). */
  createdAt: string;
  /** JSON string blob (event-specific). */
  payload: string | null;
  /** JSON string blob (request/device context). */
  context: string | null;
}

export interface ClientActivityPage {
  content: ClientActivityRow[];
  totalElements: number;
  totalPages: number;
  /** Zero-based page index. */
  page: number;
  size: number;
}

export interface ListClientActivityParams {
  /** Zero-based page index (mirrors the accounts action convention). */
  page?: number;
  size?: number;
  /** Free-text trace: UUID → exact target_id; else order_number substring. */
  search?: string;
  locationId?: string;
  deviceId?: string;
  staffId?: string;
  eventType?: string;
  /** ISO date-time, inclusive lower bound on clientTs. */
  from?: string;
  /** ISO date-time, exclusive upper bound on clientTs. */
  to?: string;
}
