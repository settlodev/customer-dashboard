"use server";

import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { ErrorResponseType } from "@/types/types";

/**
 * Server-only client for the Reports Service `/api/v2/internal/**` routes.
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
 * Reports filter doesn't expect.
 */

const REPORTS_SERVICE_URL = process.env.REPORTS_SERVICE_URL || "";
const REPORTS_INTERNAL_SECRET = process.env.REPORTS_INTERNAL_SECRET || "";

function requireConfig() {
  if (!REPORTS_SERVICE_URL) {
    throw new Error("REPORTS_SERVICE_URL is not configured");
  }
  if (!REPORTS_INTERNAL_SECRET) {
    throw new Error("REPORTS_INTERNAL_SECRET is not configured");
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): string {
  requireConfig();
  const url = new URL(`${REPORTS_SERVICE_URL}${path}`);
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
      `Reports request failed (${res.status})`,
    timestamp: new Date().toISOString(),
    path,
    correlationId: crypto.randomUUID(),
  };
  throw new SettloApiError(apiError);
}

export async function reportsInternalGet<T>(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Internal-Secret": REPORTS_INTERNAL_SECRET,
    },
    cache: "no-store",
  });
  if (!res.ok) await rejectWithApiError(res, path);
  return (await res.json()) as T;
}

export async function reportsInternalPost<T>(
  path: string,
  query?: Record<string, string | number | undefined | null>,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Internal-Secret": REPORTS_INTERNAL_SECRET,
    },
    cache: "no-store",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) await rejectWithApiError(res, path);
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}
