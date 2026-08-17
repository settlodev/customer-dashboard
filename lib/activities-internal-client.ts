// Server-only: imported only by server actions; never a client component.
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { ErrorResponseType } from "@/types/types";

/**
 * Server-only client for the Activities service (`ACTIVITIES_SERVICE_URL`,
 * currently `.../alpha/activities`) — the gateway-request tail lives here,
 * not on OMS. Same shape as {@link import("@/lib/oms-internal-client")} so
 * the browser never talks to this service directly.
 *
 * The service doesn't validate a shared secret yet, so
 * ACTIVITIES_INTERNAL_SECRET is sent only when configured; the admin page's
 * own staff-JWT + permission gate is the access control until it does. Once
 * the secret is live, setting the env var is the only change needed here.
 */

const ACTIVITIES_SERVICE_URL = process.env.ACTIVITIES_SERVICE_URL || "";
const ACTIVITIES_INTERNAL_SECRET =
  process.env.ACTIVITIES_INTERNAL_SECRET || "";

function requireConfig() {
  if (!ACTIVITIES_SERVICE_URL) {
    throw new Error("ACTIVITIES_SERVICE_URL is not configured");
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  requireConfig();
  const url = new URL(`${ACTIVITIES_SERVICE_URL}${path}`);
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
    payload = ct.includes("application/json")
      ? await res.json()
      : await res.text();
  } catch {
    // ignore — error body is best-effort
  }
  const apiError: ErrorResponseType = {
    status: res.status,
    code:
      (typeof payload === "object" &&
      payload &&
      "code" in payload &&
      typeof (payload as any).code === "string"
        ? (payload as any).code
        : null) ?? `HTTP_${res.status}`,
    message:
      (typeof payload === "object" &&
      payload &&
      "message" in payload &&
      typeof (payload as any).message === "string"
        ? (payload as any).message
        : null) ??
      (typeof payload === "string" && payload.length < 200 ? payload : null) ??
      `Activities request failed (${res.status})`,
    timestamp: new Date().toISOString(),
    path,
    correlationId: crypto.randomUUID(),
  };
  throw new SettloApiError(apiError);
}

export async function activitiesInternalGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const url = buildUrl(path, params);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (ACTIVITIES_INTERNAL_SECRET) {
    headers["X-Internal-Secret"] = ACTIVITIES_INTERNAL_SECRET;
  }
  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  if (!res.ok) await rejectWithApiError(res, path);
  return (await res.json()) as T;
}
