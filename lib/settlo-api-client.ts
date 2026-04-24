"use server";

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import https from "https";
import { handleSettloApiError } from "@/lib/settlo-api-error-handler";
import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";
import { extractSubscriptionStatus } from "@/lib/jwt-utils";
import { ErrorResponseType } from "@/types/types";
import { cookies } from "next/headers";
import { getCurrentDestination } from "@/lib/actions/context";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const AUTH_SERVICE_URL = requireEnv("AUTH_SERVICE_URL");
const ACCOUNTS_SERVICE_URL = requireEnv("ACCOUNTS_SERVICE_URL");
const REPORTS_SERVICE_URL = requireEnv("REPORTS_SERVICE_URL");
const PAYMENT_SERVICE_URL = requireEnv("PAYMENT_SERVICE_URL");
const IS_DEV = process.env.NODE_ENV !== "production";

const sharedHttpsAgent = new https.Agent({
  rejectUnauthorized: !IS_DEV,
});

// ── Module-level refresh lock ───────────────────────────────────────
// Prevents concurrent token refreshes across ApiClient instances within
// the same server-action invocation.
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

async function refreshAccessToken(currentRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // If another call is already refreshing, piggy-back on it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
      if (clientId) headers["X-Client-Id"] = clientId;

      const res = await axios.post(
        `${AUTH_SERVICE_URL}/auth/token-refresh`,
        { refreshToken: currentRefreshToken },
        { headers, httpsAgent: sharedHttpsAgent },
      );

      const newAccess = res.data?.accessToken;
      const newRefresh = res.data?.refreshToken || currentRefreshToken;
      if (!newAccess) throw new Error("No access token in refresh response");
      return { accessToken: newAccess, refreshToken: newRefresh };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── JWT helpers ─────────────────────────────────────────────────────
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const claims = JSON.parse(json);
    return typeof claims.exp === "number" ? claims.exp : null;
  } catch {
    return null;
  }
}

/** Returns true if the token expires within `marginSec` seconds. */
function isTokenExpiringSoon(token: string, marginSec = 30): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return Date.now() / 1000 > exp - marginSec;
}

// ── Dev logging ─────────────────────────────────────────────────────
const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const METHOD_COLORS: Record<string, string> = {
  GET: ANSI.green,
  POST: ANSI.cyan,
  PUT: ANSI.yellow,
  PATCH: ANSI.magenta,
  DELETE: ANSI.red,
};

function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, val] of Object.entries(headers)) {
    if (!val) continue;
    const v = String(val);
    if (key.toLowerCase() === "authorization") {
      safe[key] = v.length > 20 ? `${v.slice(0, 15)}...${v.slice(-6)}` : "***";
    } else if (key === "Idempotency-Key" || key === "X-Trace-Id") {
      safe[key] = v.slice(0, 8) + "...";
    } else {
      safe[key] = v;
    }
  }
  return safe;
}

function truncate(obj: unknown, maxLen = 200): string {
  if (obj === undefined || obj === null) return "";
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
}

function logRequest(config: InternalAxiosRequestConfig) {
  const method = (config.method || "GET").toUpperCase();
  const color = METHOD_COLORS[method] || ANSI.dim;
  const url = config.url || "";
  const shortUrl = url.replace(/^https?:\/\/[^/]+/, "");

  console.log(
    `${ANSI.dim}──▶${ANSI.reset} ${color}${ANSI.bold}${method}${ANSI.reset} ${shortUrl}`,
  );

  const hdrs = sanitizeHeaders(config.headers as Record<string, unknown>);
  const headerPairs = Object.entries(hdrs)
    .filter(([k]) => !["Content-Type", "Accept"].includes(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ");
  if (headerPairs) {
    console.log(`${ANSI.dim}    headers: ${headerPairs}${ANSI.reset}`);
  }

  if (config.data) {
    console.log(
      `${ANSI.dim}    body: ${truncate(config.data, 300)}${ANSI.reset}`,
    );
  }
}

function logResponse(response: AxiosResponse, durationMs: number) {
  const status = response.status;
  const method = (response.config.method || "GET").toUpperCase();
  const url = response.config.url || "";
  const shortUrl = url.replace(/^https?:\/\/[^/]+/, "");

  const statusColor =
    status < 300 ? ANSI.green : status < 400 ? ANSI.yellow : ANSI.red;

  console.log(
    `${ANSI.dim}◀──${ANSI.reset} ${statusColor}${ANSI.bold}${status}${ANSI.reset} ${ANSI.dim}${method} ${shortUrl}${ANSI.reset} ${ANSI.blue}${durationMs}ms${ANSI.reset}`,
  );

  if (status >= 400 && response.data) {
    const preview = truncate(response.data, 400);
    console.log(`${ANSI.dim}    error: ${preview}${ANSI.reset}`);
  }
}

function logResponseError(error: AxiosError, durationMs: number) {
  const status = error.response?.status || 0;
  const method = (error.config?.method || "GET").toUpperCase();
  const url = error.config?.url || "";
  const shortUrl = url.replace(/^https?:\/\/[^/]+/, "");

  console.log(
    `${ANSI.dim}◀──${ANSI.reset} ${ANSI.red}${ANSI.bold}${status || "ERR"}${ANSI.reset} ${ANSI.dim}${method} ${shortUrl}${ANSI.reset} ${ANSI.blue}${durationMs}ms${ANSI.reset}`,
  );

  if (error.response?.data) {
    const preview = truncate(error.response.data, 400);
    console.log(`${ANSI.red}    error: ${preview}${ANSI.reset}`);
  } else if (error.message) {
    console.log(
      `${ANSI.red}    ${error.code || "NETWORK"}: ${error.message}${ANSI.reset}`,
    );
  }
}

// ── Cookie helpers ──────────────────────────────────────────────────
async function getBusinessId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("currentBusiness")?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

/**
 * The ID to send as `X-Location-Id` depends on the user's active workspace.
 * Priority: currentWarehouse → currentStore → currentLocation. This is the
 * same resolver that mutation actions use to set `locationType` in bodies,
 * so the header and body always agree.
 */
async function getScopedLocationId(): Promise<string | null> {
  const dest = await getCurrentDestination();
  return dest?.id ?? null;
}

// ── ApiClient ───────────────────────────────────────────────────────
class ApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  public isPlain: boolean;

  constructor(
    service: "accounts" | "auth" | "reports" | "payments" | boolean = "accounts",
  ) {
    if (typeof service === "boolean") {
      this.baseURL = service ? AUTH_SERVICE_URL : ACCOUNTS_SERVICE_URL;
    } else {
      this.baseURL =
        service === "auth"
          ? AUTH_SERVICE_URL
          : service === "reports"
            ? REPORTS_SERVICE_URL
            : service === "payments"
              ? PAYMENT_SERVICE_URL
              : ACCOUNTS_SERVICE_URL;
    }
    this.isPlain = false;

    this.instance = axios.create({
      httpsAgent: sharedHttpsAgent,
    });

    // ── Request interceptor ───────────────────────────────────────
    this.instance.interceptors.request.use(async (config) => {
      // Resolve full URL
      if (!config.url?.startsWith("http")) {
        config.url = this.baseURL + config.url;
      }

      // Attach request start time for duration logging
      (config as any)._startTime = Date.now();

      // Auth
      if (this.isPlain) {
        (config as any)._isPlain = true;
      } else {
        let token = await getAuthToken();

        // Proactive refresh: if the access token is expired or about to
        // expire, refresh it before sending the request — avoids a
        // wasted 401 round-trip.
        if (
          token?.accessToken &&
          token.refreshToken &&
          isTokenExpiringSoon(token.accessToken) &&
          !config.url?.includes("/token-refresh") &&
          !config.url?.includes("/login")
        ) {
          try {
            const refreshed = await refreshAccessToken(token.refreshToken);
            try {
              await updateAuthToken({
                ...token,
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
                subscriptionStatus: extractSubscriptionStatus(
                  refreshed.accessToken,
                ),
              });
            } catch {
              // Cookie update may fail outside Server Actions
            }
            token = {
              ...token,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
            };
          } catch {
            // Proactive refresh failed — proceed with the old token
            // and let the 401 interceptor handle it reactively.
          }
        }

        if (token?.accessToken) {
          config.headers["Authorization"] = `Bearer ${token.accessToken}`;
        }

        // Identity headers — always sent when authenticated so the backend
        // can populate audit fields (createdBy/approvedBy/etc.) and apply
        // account-level rate limits.
        if (token?.accountId) {
          config.headers["X-Account-Id"] = token.accountId;
        }
        if (token?.userId) {
          config.headers["X-User-Id"] = token.userId;
        }
      }

      // Business / location headers from cookies (regardless of plain mode,
      // these provide request scoping for downstream services). The
      // location ID resolves to the active warehouse/store/location the
      // user currently has selected — see getCurrentDestination.
      const [businessId, locationId] = await Promise.all([
        getBusinessId(),
        getScopedLocationId(),
      ]);
      if (businessId) config.headers["X-Business-Id"] = businessId;
      if (locationId) config.headers["X-Location-Id"] = locationId;

      // Content-Type — JSON by default, but skip when the body is FormData
      // so axios can set multipart/form-data with the correct boundary.
      const isFormData =
        typeof FormData !== "undefined" && config.data instanceof FormData;
      if (
        (!config.responseType || config.responseType !== "blob") &&
        !isFormData
      ) {
        config.headers["Content-Type"] = "application/json";
      }
      if (isFormData) {
        // Delete any inherited content-type so axios auto-detects the boundary.
        delete config.headers["Content-Type"];
      }

      // Whitelabel
      const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
      if (clientId) config.headers["X-Client-Id"] = clientId;

      // Idempotency + trace on mutations
      const method = config.method?.toUpperCase();
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        config.headers["Idempotency-Key"] = crypto.randomUUID();
        config.headers["X-Trace-Id"] = crypto.randomUUID();
      }

      if (IS_DEV) logRequest(config);

      return config;
    });

    // ── Response interceptor ──────────────────────────────────────
    this.instance.interceptors.response.use(
      (response) => {
        if (IS_DEV) {
          const start = (response.config as any)?._startTime || Date.now();
          logResponse(response, Date.now() - start);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (IS_DEV) {
          const start = (originalRequest as any)?._startTime || Date.now();
          logResponseError(error, Date.now() - start);
        }

        // Skip retry for plain (unauthenticated) requests
        if ((originalRequest as any)?._isPlain) {
          return Promise.reject(error);
        }

        // Reactive refresh on 401 — only if the proactive refresh didn't
        // already run (indicated by _retry flag).
        if (
          status === 401 &&
          originalRequest &&
          !(originalRequest as any)._retry &&
          !originalRequest.url?.includes("/token-refresh") &&
          !originalRequest.url?.includes("/login")
        ) {
          (originalRequest as any)._retry = true;

          try {
            const token = await getAuthToken();
            if (!token?.refreshToken) {
              throw new Error("No refresh token available");
            }

            const refreshed = await refreshAccessToken(token.refreshToken);

            try {
              await updateAuthToken({
                ...token,
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
                subscriptionStatus: extractSubscriptionStatus(
                  refreshed.accessToken,
                ),
              });
            } catch {
              // Cookie update may fail outside Server Actions
            }

            if (IS_DEV) {
              console.log(
                `${ANSI.yellow}${ANSI.bold}↻ TOKEN REFRESHED${ANSI.reset} ${ANSI.dim}retrying ${originalRequest.method?.toUpperCase()} ${originalRequest.url?.replace(/^https?:\/\/[^/]+/, "")}${ANSI.reset}`,
              );
            }

            originalRequest.headers["Authorization"] =
              `Bearer ${refreshed.accessToken}`;
            return this.instance(originalRequest);
          } catch {
            // Refresh failed — session is unrecoverable
            const sessionError: ErrorResponseType = {
              status: 401,
              code: "SESSION_EXPIRED",
              message: "Your session has expired. Please log in again.",
              timestamp: new Date().toISOString(),
              path: originalRequest?.url,
              correlationId: crypto.randomUUID(),
            };

            if (IS_DEV) {
              console.log(
                `${ANSI.red}${ANSI.bold}✕ SESSION EXPIRED${ANSI.reset} ${ANSI.dim}refresh token rejected — session is dead${ANSI.reset}`,
              );
            }

            return Promise.reject(sessionError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<T>(url, config);
      if (config?.responseType === "blob") {
        return response as unknown as T;
      }
      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async downloadFile(
    url: string,
    accept = "application/octet-stream, text/csv",
  ): Promise<{
    data: Buffer;
    filename: string;
    contentType: string;
  }> {
    try {
      const response = await this.instance.get<Buffer>(url, {
        responseType: "arraybuffer",
        headers: { Accept: accept },
      });

      let filename = "download.csv";
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (match?.[1]) filename = match[1].replace(/['"]/g, "");
      }

      const contentType =
        (response.headers["content-type"] as string | undefined) ??
        "application/octet-stream";

      return { data: response.data, filename, contentType };
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async post<T, U>(
    url: string,
    data: U,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async put<T, U>(
    url: string,
    data: U,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async patch<T, U>(
    url: string,
    data: U,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw await handleSettloApiError(error);
    }
  }
}

export default ApiClient;
