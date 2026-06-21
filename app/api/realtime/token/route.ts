import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-utils";

/**
 * Hands an access token to client JavaScript so the WebSocket Gateway
 * client can put it in the CONNECT frame's `payload.token`. The token
 * otherwise lives only in HTTP-only cookies.
 *
 * <p><b>SECURITY — known residual risk (token exposure to JS).</b>
 * The gateway only accepts a full, signature-verified RS256 access
 * token (it validates iss=settlo-auth-service + aud=settlo-services +
 * signature + expiry via the Auth Service JWKS) carried in-band in the
 * CONNECT frame. It exposes NO HTTP endpoint, NO ticket / one-time
 * token mechanism, and NO query-string / subprotocol auth path — so
 * the dashboard cannot mint or request a short-lived, realtime-scoped
 * credential today. Whatever we return here is therefore a live,
 * full-scope bearer token that any XSS on the page could exfiltrate.
 *
 * <p><b>Mitigations applied here:</b>
 * <ul>
 *   <li>Issued only to an authenticated caller (401 otherwise) — the
 *       token is read from the caller's own HTTP-only cookie, never
 *       minted or elevated.</li>
 *   <li>Response is trimmed to the access token ALONE. The gateway
 *       resolves identity (sub / account_id / business_id /
 *       subject_type) strictly from the validated JWT and never trusts
 *       client-supplied payload, and the sole consumer
 *       (`lib/realtime/gateway-client.ts`) reads only `accessToken`.
 *       Echoing businessId/userId back to JS was needless extra
 *       surface, so it is removed.</li>
 *   <li>`no-store` so the token is never cached by the browser or any
 *       intermediary.</li>
 * </ul>
 *
 * <p><b>Proper fix (requires a backend change — out of scope for the
 * dashboard alone):</b> add an authenticated Auth Service endpoint that
 * mints a SHORT-TTL (e.g. 30–60s), realtime-scoped JWT for the calling
 * user — same iss/aud and the claims the gateway reads (subject_type,
 * sub, business_id, account_id) — signed by the Auth Service key. The
 * gateway would then validate it through its EXISTING path with no
 * gateway code change; this route would request that short-TTL token
 * instead of handing out the full session access token. A true
 * single-use / opaque ticket would additionally require a new
 * Redis-backed validation branch in the gateway's CONNECT handler.
 * Until that endpoint exists, this remains a partial mitigation, not a
 * full fix.
 */
export async function GET() {
  const token = await getAuthToken();
  if (!token?.accessToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json(
    {
      accessToken: token.accessToken,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
