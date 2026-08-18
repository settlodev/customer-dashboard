import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, LogIn, SearchX } from "lucide-react";

/**
 * 404 boundary for the internal-staff (admin) route group. The root
 * app/not-found.tsx picks its buttons from next-auth `useSession()` — staff
 * never have a next-auth session (they live entirely in the staffAuthToken
 * cookie), so it always rendered the "unauthenticated" links pointing at "/",
 * which on the admin subdomain just re-enters the page tree. This boundary
 * keeps operators on admin-correct routes: a logged-in operator clicks through
 * to the dashboard; a logged-out one (or anyone whose session just died) is one
 * click from the login screen — middleware resolves either correctly.
 */
export default function AdminNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md rounded-xl border shadow-sm">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <SearchX className="h-7 w-7 text-primary" />
          </div>

          <p className="mt-6 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent">
            404
          </p>

          <h1 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Page not found
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This admin page doesn&apos;t exist or may have moved.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="gap-2">
              <Link href="/admin/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
