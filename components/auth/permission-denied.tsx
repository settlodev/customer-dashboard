"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldOff, Home, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PermissionDeniedProps {
  message?: string;
  correlationId?: string;
}

/**
 * Shown when a server action / loader returns a 403 FORBIDDEN. Replaces the
 * generic "Something went wrong" page so users understand it's an access
 * issue, not an outage.
 */
export default function PermissionDenied({ message, correlationId }: PermissionDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldOff className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Permission Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            {message ||
              "You don't have permission to view this page or perform this action. If you believe this is a mistake, contact your administrator."}
          </p>

          {correlationId && (
            <p className="text-xs text-muted-foreground font-mono break-all">
              Ref: {correlationId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="default"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Need access?{" "}
            <a
              href="mailto:support@settlo.co.tz"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              Contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * True when the error is a 403 FORBIDDEN from the API client. Handles both
 * direct ErrorResponseType objects and the serialized Error form server
 * actions produce (where the structured error survives only as JSON in
 * `error.message`).
 *
 * Note: more specific 403 codes (ACCOUNT_LOCKED, ACCOUNT_DISABLED) are
 * mapped to their own codes upstream in handleSettloApiError, so this only
 * matches the generic FORBIDDEN case.
 */
export function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as Record<string, unknown>;

  // Primary: digest is the only reliable signal across the RSC boundary in
  // production — set by SettloApiError to err.code.
  if (typeof err.digest === "string" && err.digest === "FORBIDDEN") return true;

  // Same-context throws: structured error has the code directly.
  if (typeof err.code === "string" && err.code === "FORBIDDEN") return true;

  // Dev-mode fallback: error.message may contain the JSON when the throw
  // happened from a plain object before SettloApiError wrapping landed.
  if (err instanceof Error || typeof err.message === "string") {
    const msg = String(err.message || "");
    try {
      const parsed = JSON.parse(msg);
      if (typeof parsed?.code === "string" && parsed.code === "FORBIDDEN") {
        return true;
      }
    } catch {
      if (msg.includes('"code":"FORBIDDEN"')) return true;
    }
  }

  return false;
}

/**
 * Pull a user-facing message and correlation ID out of an error shape that
 * may be either the structured ErrorResponseType or a server-action Error
 * whose `message` is the JSON-stringified ErrorResponseType.
 */
export function extractPermissionDeniedDetails(error: unknown): {
  message?: string;
  correlationId?: string;
} {
  if (!error || typeof error !== "object") return {};
  const err = error as Record<string, unknown>;

  let source: Record<string, unknown> = err;
  if (typeof err.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed === "object") {
        source = parsed as Record<string, unknown>;
      }
    } catch {
      // not JSON — fall back to the raw error
    }
  }

  const rawMessage =
    typeof source.message === "string" ? source.message : undefined;
  // Drop the bare "Access Denied" string in favour of the friendlier default.
  const message =
    rawMessage && rawMessage.toLowerCase() !== "access denied"
      ? rawMessage
      : undefined;

  return {
    message,
    correlationId:
      typeof source.correlationId === "string"
        ? source.correlationId
        : undefined,
  };
}
