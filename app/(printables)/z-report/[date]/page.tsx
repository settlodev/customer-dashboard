import { notFound } from "next/navigation";

import { getCurrentDestination } from "@/lib/actions/context";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { getZReportDay } from "@/lib/actions/z-report-actions";
import { requireReportAccess } from "@/lib/auth-utils";
import { PrintableDocument } from "@/components/documents/PrintableDocument";
import { CombinedZReportSheet } from "@/components/reports/z-report/combined-z-report-sheet";

type Params = Promise<{ date: string }>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Authenticated print/download view for the combined daily Z-report — the
 * formal page an owner files: every session of a business date rolled up and
 * set against the TRA fiscal Z for the same date.
 *
 * <p>Mirrors the Close-of-Day print route (chrome-free `(printables)` group,
 * server component, one fan-out over the day's sources plus the letterhead),
 * and is gated on the same permission as the on-screen report so the print
 * URL can't be used to read around the page guard.
 */
export default async function CombinedZReportPage({
  params,
}: {
  params: Params;
}) {
  const { date } = await params;
  await requireReportAccess("/report/z-report");

  if (!ISO_DATE.test(date)) notFound();

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();

  const [day, location, letterhead] = await Promise.all([
    getZReportDay(destination.id, date),
    getCurrentLocation().catch(() => undefined),
    getLetterhead().catch(() => null),
  ]);

  // Nothing on either side means there is no document to print — a blank
  // letterhead with zeroes would be worse than a 404.
  if (!day.local && !day.vfd) notFound();

  return (
    <PrintableDocument documentTitle={`Z-Report — ${date}`}>
      <CombinedZReportSheet
        day={day}
        locationName={location?.name ?? null}
        letterhead={letterhead}
        generatedAt={new Date().toISOString()}
      />
    </PrintableDocument>
  );
}
