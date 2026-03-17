import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* 404 */}
        <div className="space-y-2">
          <p className="text-6xl font-bold text-primary">404</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you&#39;re looking for doesn&#39;t exist or may have been
            moved.
          </p>
        </div>

        {/* Action */}
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
