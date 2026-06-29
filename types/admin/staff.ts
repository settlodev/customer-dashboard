/**
 * Minimal staff shape returned by the Accounts admin endpoint
 * `GET /api/v1/admin/staff/{staffId}`.
 *
 * Only the fields used by the Stuck Writes details modal are declared here;
 * the server may return additional fields that are safely ignored.
 */
export interface AdminStaffSummary {
  id: string;
  /** Full display name (always populated when present). */
  fullName: string | null;
  /** Given name. */
  firstName: string | null;
  /** Family name. */
  lastName: string | null;
}
