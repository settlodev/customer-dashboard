/**
 * Minimal device shape returned by the Accounts admin endpoint
 * `GET /api/v1/admin/devices/{deviceId}`.
 *
 * Only the fields used by the Stuck Writes details modal are declared here;
 * the server may return additional fields that are safely ignored.
 */
export interface AdminDeviceSummary {
  id: string;
  /** Operator-assigned friendly name (e.g. "Counter 1"). */
  customName: string | null;
  /** System-generated or hardware name (e.g. "Sunmi T2 Mini"). */
  name: string | null;
}
