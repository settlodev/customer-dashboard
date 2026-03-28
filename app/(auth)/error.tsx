"use client";

import { Button } from "@/components/ui/button";
import { ServerCrash, RotateCcw, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isNetworkError =
    error.message?.includes("NETWORK_ERROR") ||
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Failed to connect") ||
    error.message?.includes("fetch failed");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
          <ServerCrash className="h-8 w-8 text-orange-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">
            {isNetworkError
              ? "Services temporarily unavailable"
              : "Something went wrong"}
          </h1>
          <p className="text-sm text-gray-500">
            {isNetworkError
              ? "We're having trouble connecting to our servers. This is usually temporary — please try again in a moment."
              : "An unexpected error occurred. Please try again or log out and sign back in."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full h-11"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          If the problem persists, please contact{" "}
          <a
            href="mailto:support@settlo.co.tz"
            className="text-primary hover:underline"
          >
            support@settlo.co.tz
          </a>
        </p>
      </div>
    </div>
  );
}
