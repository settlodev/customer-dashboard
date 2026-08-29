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
  businessName: string | null;
  upstreamServerName: string;
  incomingIpAddress: string;
  incomingUrl: string;
  outgoingUrl: string;
  httpMethod: string;
  userAgent: string;
  vercelId: string | null;
  locationId: string | null;
  locationName: string | null;
  staffId: string | null;
  staffName: string | null;
  accountId: string | null;
  accountFullName: string | null;
  accountEmail: string | null;
  accountPhoneNumber: string | null;
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
  upstreamErrorMessage: string | null;
  upstreamResponseTimeMs: number | null;
  createdAt: string;
}

/** Gateway. */
export interface GatewayRequestPage {
  content: GatewayRequestRow[];
  totalElements: number;
}

/** Keys of {@link ListGatewayRequestsParams} that come from the filter UI,
 * always carried as raw strings (URL search params / form inputs) — the
 * server action is responsible for parsing `upstreamStatusCode` to a number
 * and `hasUpstreamError` to a boolean. An empty string means "not set". */
export const GATEWAY_REQUEST_FILTER_KEYS = [
  "upstreamServerName",
  "httpMethod",
  "upstreamStatusCode",
  "hasUpstreamError",
] as const;

export type GatewayRequestFilterKey = (typeof GATEWAY_REQUEST_FILTER_KEYS)[number];

export type GatewayRequestFilterValues = Record<GatewayRequestFilterKey, string>;

export const EMPTY_GATEWAY_REQUEST_FILTERS: GatewayRequestFilterValues =
  Object.fromEntries(
    GATEWAY_REQUEST_FILTER_KEYS.map((key) => [key, ""]),
  ) as GatewayRequestFilterValues;

export interface ListGatewayRequestsParams {
  /** Zero-based page index. */
  page?: number;

  size?: number;
  upstreamServerName?: string;
  httpMethod?: string;
  upstreamStatusCode?: number;
  hasUpstreamError?: boolean;
}
