/**
 * Server-only single-flight refresh of a USER access token, used by the
 * realtime token route (`app/api/realtime/token/route.ts`) so the WebSocket
 * CONNECT frame is never handed an already-expired token.
 *
 * This deliberately duplicates the auth-service refresh call that also lives in
 * `lib/settlo-api-client.ts` (Node, axios) and `middleware.ts` (edge, fetch):
 * that module is `"use server"` (its exports become server actions, so its
 * `refreshAccessToken` can't be imported), and middleware runs in a different
 * runtime. Each keeps its own single-flight lock; they can't share one across
 * runtimes anyway. Not imported by any client component (uses `process.env` +
 * server `fetch`).
 */

let inflight: Promise<RefreshedTokens | null> | null = null;

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Exchange a refresh token for a fresh access+refresh pair via the auth
 * service. Single-flight: concurrent callers share the in-flight request.
 * Returns null on any failure (missing config, network, non-2xx, no token in
 * the response) — the caller decides whether the current token is still usable.
 */
export function refreshUserAccessToken(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  if (inflight) return inflight;
  inflight = doRefresh(refreshToken).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(refreshToken: string): Promise<RefreshedTokens | null> {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  if (!authServiceUrl) return null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
    if (clientId) headers["X-Client-Id"] = clientId;

    const res = await fetch(`${authServiceUrl}/auth/token-refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.accessToken) return null;

    return {
      accessToken: data.accessToken,
      // The auth service may rotate the refresh token; fall back to the current
      // one if it doesn't return a new one.
      refreshToken: data.refreshToken || refreshToken,
    };
  } catch {
    return null;
  }
}
