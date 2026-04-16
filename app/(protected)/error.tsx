"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw, Mail } from "lucide-react";
import SessionExpired, { isSessionExpiredError } from "@/components/auth/session-expired";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (isSessionExpiredError(error)) {
    return <SessionExpired />;
  }

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
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while processing your request. Please
            try again or return to the dashboard.
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
          <Button onClick={reset} variant="default" className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
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
