"use server";

import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { ErrorResponseType } from "@/types/types";

/**
 * Server-only client for the Order-Management Service `/api/v1/admin/**`
 * internal routes (e.g. client-activity browse).
 *
 * These endpoints are gated by `InternalApiAuthFilter` (X-Internal-Secret
 * header) — they are NOT meant for direct browser/JWT calls. We hold the
 * shared secret on the Next.js server and act as a trusted proxy. The
 * admin pages that consume these actions are already JWT-gated to staff,
 * so the effective security boundary is the same as a JWT-protected
 * endpoint, without requiring a backend change.
 *
 * The helper deliberately does NOT use the shared ApiClient — that
 * attaches Authorization, X-Account-Id, X-Business-Id headers which the
 * internal-secret filter doesn't expect.
 */

const ORDER_MANAGEMENT_SERVICE_URL =
  process.env.ORDER_MANAGEMENT_SERVICE_URL || "";
const OMS_ADMIN_INTERNAL_SECRET = process.env.OMS_ADMIN_INTERNAL_SECRET || "";

function requireConfig() {
  if (!ORDER_MANAGEMENT_SERVICE_URL) {
    throw new Error("ORDER_MANAGEMENT_SERVICE_URL is not configured");
  }
  if (!OMS_ADMIN_INTERNAL_SECRET) {
    throw new Error("OMS_ADMIN_INTERNAL_SECRET is not configured");
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): string {
  requireConfig();
  const url = new URL(`${ORDER_MANAGEMENT_SERVICE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rejectWithApiError(
  res: Response,
  path: string,
): Promise<never> {
  let payload: unknown = null;
  const ct = res.headers.get("content-type") || "";
  try {
    payload = ct.includes("application/json") ? await res.json() : await res.text();
  } catch {
    // ignore — error body is best-effort
  }
  const apiError: ErrorResponseType = {
    status: res.status,
    code:
      (typeof payload === "object" && payload && "code" in payload && typeof (payload as any).code === "string"
        ? (payload as any).code
        : null) ?? `HTTP_${res.status}`,
    message:
      (typeof payload === "object" && payload && "message" in payload && typeof (payload as any).message === "string"
        ? (payload as any).message
        : null) ??
      (typeof payload === "string" && payload.length < 200 ? payload : null) ??
      `Order-management request failed (${res.status})`,
    timestamp: new Date().toISOString(),
    path,
    correlationId: crypto.randomUUID(),
  };
  throw new SettloApiError(apiError);
}

export async function omsInternalGet<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Internal-Secret": OMS_ADMIN_INTERNAL_SECRET,
    },
    cache: "no-store",
  });
  if (!res.ok) await rejectWithApiError(res, path);
  return (await res.json()) as T;
}
