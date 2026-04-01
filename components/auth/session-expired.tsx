"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when the user's session has expired and token refresh failed.
 * Auto-redirects to login after a short delay, or the user can click immediately.
 */
export default function SessionExpired({ message }: { message?: string }) {
  const router = useRouter();

  const handleLogin = () => {
    // Clear cookies via the API route, then redirect
    fetch("/api/clear-token").finally(() => {
      router.push("/login");
    });
  };

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(handleLogin, 5000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="h-7 w-7 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session Expired
          </h3>
          <p className="text-sm text-muted-foreground">
            {message || "Your session has expired. Please log in again to continue."}
          </p>
          <Button onClick={handleLogin} className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            Log In Again
          </Button>
          <p className="text-xs text-muted-foreground">
            Redirecting automatically...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Helper to check if an error is a session expired error.
 * Handles both direct ErrorResponseType objects and serialized Error objects
 * (server actions serialize thrown objects into Error with JSON message).
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const SESSION_CODES = ["SESSION_EXPIRED", "UNAUTHORIZED", "REFRESH_TOKEN_INVALID", "REFRESH_TOKEN_EXPIRED"];

  // Direct structured error (ErrorResponseType)
  const err = error as Record<string, unknown>;
  if (typeof err.code === "string" && SESSION_CODES.includes(err.code)) {
    return true;
  }

  // Serialized Error from server actions — message contains JSON
  if (err instanceof Error || typeof err.message === "string") {
    const msg = String(err.message || "");
    try {
      const parsed = JSON.parse(msg);
      if (typeof parsed.code === "string" && SESSION_CODES.includes(parsed.code)) {
        return true;
      }
    } catch {
      // Not JSON — check if message contains session-related text
      if (msg.includes("SESSION_EXPIRED") || msg.includes("session has expired")) {
        return true;
      }
    }
  }

  // Check digest property (Next.js server error)
  if ("digest" in err && typeof err.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (typeof parsed.code === "string" && SESSION_CODES.includes(parsed.code)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}
