/**
 * Types for the gateway-request tail. Mirrors the Activities service's
 * `GET /api/v1/gateway-requests` response — raw HTTP requests passing
 * through the API gateway across every upstream service, distinct from the
 * OMS `client_activity` business-event stream (see activity-log.ts).
 */

/** One raw request observed at the gateway. */
export interface GatewayRequestRow {
  userId: string | null;
  businessId: string | null;
  upstreamServerName: string;
  incomingIpAddress: string;
  incomingUrl: string;
  outgoingUrl: string;
  httpMethod: string;
  userAgent: string;
  vercelId: string | null;
  locationId: string | null;
  staffId: string | null;
  accountId: string | null;
  daySessionId: string | null;
  countryIsoCode: string | null;
  countryName: string | null;
  city: string | null;
  subdivision: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  accuracyRadiusKm: number | null;
  gatewayRequestId: string | null;
  upstreamStatusCode: number | null;
  upstreamResponseTimeMs: number | null;
  createdAt: string;
}

/** Gateway. */
export interface GatewayRequestPage {
  content: GatewayRequestRow[];
  totalElements: number;
}

export interface ListGatewayRequestsParams {
  /** Zero-based page index. */
  page?: number;

  size?: number;
}
