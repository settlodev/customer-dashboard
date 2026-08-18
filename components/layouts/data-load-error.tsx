"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { Button } from "@/components/ui/button";

interface DataLoadErrorProps {
  /** Plural resource name, e.g. "products". */
  itemName: string;
  /** Optional override for the body copy. */
  message?: string;
}

/**
 * In-page fallback for a failed server-side data fetch.
 *
 * Throwing out of a Server Component trips the route's error.tsx and replaces
 * the entire page; for a transient backend blip that's heavier than warranted.
 * Rendering this instead keeps the page chrome — header, tabs, actions — and
 * degrades only the data area, with a Try-again that re-runs the server render
 * via router.refresh(). Mirrors NoItems' styling so the two read as a pair.
 */
export default function DataLoadError({ itemName, message }: DataLoadErrorProps) {
  const router = useRouter();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-240px)] flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-card px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
      />

      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-canvas">
        <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>

      <h2 className="text-lg font-semibold leading-tight tracking-tight text-ink">
        Couldn&apos;t load {itemName}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message ??
          `We couldn't load ${itemName} right now. This is usually temporary — please try again in a moment.`}
      </p>

      <Button className="mt-6" size="sm" type="button" onClick={handleRetry}>
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
