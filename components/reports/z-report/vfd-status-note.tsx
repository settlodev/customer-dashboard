import Link from "next/link";

import type { VfdAvailability } from "@/types/reports/z-report";

/**
 * One quiet line about the fiscal side, shown only when there is nothing
 * fiscal to show. A location that isn't registered for TRA printing gets a
 * plain daily Z-report with this single note — not a banner, not empty
 * fiscal columns, not an explanation of how TRA works. Renders nothing when
 * the device answered, since the fiscal figures then speak for themselves.
 */
export function VfdStatusNote({
  availability,
  error,
}: {
  availability: VfdAvailability;
  error?: string | null;
}) {
  if (availability === "available") return null;

  if (availability === "not-registered") {
    return (
      <p className="text-[12px] text-muted-foreground">
        Local figures only — this location isn&apos;t registered for TRA
        fiscal printing.{" "}
        <Link href="/settings" className="underline hover:text-ink">
          Register a device
        </Link>{" "}
        to compare against the fiscal Z.
      </p>
    );
  }

  if (availability === "not-verified") {
    return (
      <p className="text-[12px] text-muted-foreground">
        Local figures only — the fiscal device registration is still awaiting
        TRA activation.
      </p>
    );
  }

  return (
    <p className="text-[12px] text-warn">
      Couldn&apos;t reach the fiscal device service
      {error ? ` (${error})` : ""} — showing local figures only.
    </p>
  );
}
