import Link from "next/link";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import type { VfdAvailability } from "@/types/reports/z-report";

/**
 * Says why the fiscal half of a Z-report page is empty. Renders nothing when
 * the device answered — a banner on a working day would be noise.
 *
 * <p>The three empty cases mean very different things to an operator (never
 * onboarded / waiting on TRA / the lookup broke), so each gets its own copy
 * rather than one "no VFD data" line.
 */
export function VfdStatusNotice({
  availability,
  error,
}: {
  availability: VfdAvailability;
  error?: string | null;
}) {
  if (availability === "available") return null;

  if (availability === "not-registered") {
    return (
      <Alert tone="default" variant="outline">
        <AlertIcon>
          <Info className="h-3.5 w-3.5" />
        </AlertIcon>
        <AlertBody>
          <AlertTitle>Local figures only</AlertTitle>
          <AlertDescription>
            This location isn&apos;t registered for TRA fiscal printing, so
            there is no VFD Z-report to compare against.{" "}
            <Link href="/settings" className="underline">
              Register a fiscal device
            </Link>{" "}
            to see both sides here.
          </AlertDescription>
        </AlertBody>
      </Alert>
    );
  }

  if (availability === "not-verified") {
    return (
      <Alert tone="info" variant="soft">
        <AlertIcon>
          <ShieldCheck className="h-3.5 w-3.5" />
        </AlertIcon>
        <AlertBody>
          <AlertTitle>Fiscal registration pending</AlertTitle>
          <AlertDescription>
            The VFD registration for this location has been submitted but TRA
            hasn&apos;t activated it yet. Fiscal figures appear here once it is
            verified — local figures below are unaffected.
          </AlertDescription>
        </AlertBody>
      </Alert>
    );
  }

  return (
    <Alert tone="warning" variant="soft">
      <AlertIcon>
        <AlertTriangle className="h-3.5 w-3.5" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Couldn&apos;t load the VFD Z-report</AlertTitle>
        <AlertDescription>
          {error ??
            "The fiscal device service didn't respond."}{" "}
          Local figures below are complete; retry in a moment to compare them
          against TRA.
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}
