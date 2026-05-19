"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, LayoutDashboard, SearchX } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md rounded-xl border shadow-sm">
        <CardContent className="flex flex-col items-center p-8 text-center">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <SearchX className="h-7 w-7 text-primary" />
          </div>

          {/* 404 */}
          <p className="mt-6 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent">
            404
          </p>

          <h1 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Page not found
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.{" "}
            {isLoggedIn
              ? "Check the URL or head back to the dashboard."
              : "Check the URL or go back to the home page."}
          </p>

          {/* Actions */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Button asChild className="gap-2">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
