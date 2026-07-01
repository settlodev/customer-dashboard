"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LayoutDashboard, RotateCcw, Mail } from "lucide-react";
import SessionExpired, {
  isSessionExpiredError,
} from "@/components/auth/session-expired";
import PermissionDenied, {
  extractPermissionDeniedDetails,
  isPermissionDeniedError,
} from "@/components/auth/permission-denied";

/**
 * Error boundary for the internal-staff (admin) route group — the admin
 * analogue of (protected)/error.tsx. A SESSION_EXPIRED throw (e.g. the
 * ApiClient rejecting a dead staff token at render time) renders
 * <SessionExpired/>, which clears the staffAuthToken cookie via
 * /api/clear-token and routes back to /login. Without this boundary the throw
 * bubbled all the way to the generic global-error page, the dead cookie was
 * never cleared, and the operator was stuck reloading into the same failure.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  if (isSessionExpiredError(error)) {
    return <SessionExpired />;
  }

  if (isPermissionDeniedError(error)) {
    const { message, correlationId, requiredPermission } =
      extractPermissionDeniedDetails(error);
    return (
      <PermissionDenied
        message={message}
        correlationId={correlationId}
        requiredPermission={requiredPermission}
      />
    );
  }

  const handleReset = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  // Transient backend failures (gateway 502/503/504 → SERVICE_UNAVAILABLE,
  // timeouts/connection drops → NETWORK_ERROR). digest survives the RSC
  // boundary — SettloApiError sets it to err.code.
  const isTransient =
    error.digest === "SERVICE_UNAVAILABLE" || error.digest === "NETWORK_ERROR";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isTransient
              ? "Service temporarily unavailable"
              : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTransient
              ? "We couldn't reach the server just now. This is usually temporary and your data is safe — please try again in a moment."
              : "An unexpected error occurred. Please try again or return to the dashboard."}
          </p>
        </div>

        {/* Error detail (collapsible) */}
        {error.message && (
          <details className="text-left rounded-lg border bg-muted/50 p-3">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
              Error details
            </summary>
            <p className="mt-2 text-xs text-muted-foreground font-mono break-all">
              {error.message}
            </p>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleReset}
            variant="default"
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Support link */}
        <p className="text-xs text-muted-foreground">
          Problem persists?{" "}
          <a
            href="mailto:support@settlo.co.tz"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <Mail className="h-3 w-3" />
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
