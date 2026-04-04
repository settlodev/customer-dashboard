import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function MenuNotFound() {
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
            <UtensilsCrossed className="h-7 w-7 text-primary" />
          </div>

          {/* 404 */}
          <p className="mt-6 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent">
            404
          </p>

          <h1 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Menu not found
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This menu may no longer be available, or the link you followed could
            be incorrect. Please double-check the URL or contact the restaurant
            for an updated link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
