import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-utils";

/**
 * Hands the access token to client JavaScript so it can be sent in
 * the WebSocket Gateway's CONNECT frame. The token is otherwise
 * locked inside HTTP-only cookies.
 *
 * <p>This is intentionally a separate, narrowly-scoped endpoint
 * rather than re-exposing the entire AuthToken — only the access
 * token is needed for the gateway handshake, and the route is hit
 * once per connection (cached client-side until expiry / reconnect).
 */
export async function GET() {
  const token = await getAuthToken();
  if (!token?.accessToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json(
    {
      accessToken: token.accessToken,
      businessId: token.businessId ?? null,
      userId: token.userId ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
