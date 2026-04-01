import { SubscriptionStatus } from "@/types/types";

/**
 * Decode a JWT payload (without verifying signature) to extract claims.
 */
function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Use atob for browser/edge compatibility, Buffer for Node
    const json = typeof Buffer !== "undefined"
      ? Buffer.from(base64, "base64").toString("utf-8")
      : atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Extract subscription_status from a JWT access token.
 */
export function extractSubscriptionStatus(accessToken: string): SubscriptionStatus {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return null;
  const status = claims.subscription_status as string | undefined;
  if (!status) return null;
  const valid: SubscriptionStatus[] = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED"];
  return valid.includes(status as SubscriptionStatus) ? (status as SubscriptionStatus) : null;
}
