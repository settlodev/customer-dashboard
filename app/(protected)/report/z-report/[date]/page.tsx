import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Printer } from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { StatusPill } from "@/components/layouts/order-detail";
import { Button } from "@/components/ui/button";
import { VfdStatusNote } from "@/components/reports/z-report/vfd-status-note";
import { getCurrentDestination } from "@/lib/actions/context";
import { getZReportDay } from "@/lib/actions/z-report-actions";
import { requireReportAccess } from "@/lib/auth-utils";
import { ZReportDayView } from "./z-report-day-view";

type Params = { params: Promise<{ date: string }> };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The combined Z-report for a single business date: every session of that day
 * rolled into one set of figures, with the TRA fiscal Z beside them when the
 * location prints fiscal receipts.
 *
 * <p>Drill-down target of the Z-report list. The per-session detail an
 * operator needs at close (item-level voids, prepayment lines, the cash-up)
 * stays on each session's own Close-of-Day page, linked from the sessions
 * tab — this page is the day-level view those roll up into.
 */
export default async function ZReportDayPage({ params }: Params) {
  const { date } = await params;
  await requireReportAccess("/report/z-report");

  if (!ISO_DATE.test(date)) notFound();

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();

  const day = await getZReportDay(destination.id, date);
  const longDate = format(new Date(`${date}T00:00:00`), "EEEE, MMMM d, yyyy");

  const breadcrumbs = (
    <PageBreadcrumbs
      items={[{ title: "Z-report", href: "/report/z-report" }, { title: date }]}
    />
  );

  if (!day.local && !day.vfd) {
    return (
      <PageShell maxWidth="wide">
        {breadcrumbs}
        <PageHeader title={longDate} subtitle="Nothing recorded for this day." />
        <PageBody>
          <NoItems itemName="sessions" />
        </PageBody>
      </PageShell>
    );
  }

  const { local, aggregate } = day;
  const subtitleParts: string[] = [];
  if (local) {
    subtitleParts.push(
      `${local.sessionCount} ${local.sessionCount === 1 ? "session" : "sessions"}`,
      `${local.orderCount} orders`,
    );
  } else {
    subtitleParts.push("Fiscal Z only — no day session on this date");
  }
  if (aggregate && aggregate.missingSessionCount > 0) {
    subtitleParts.push(
      `${aggregate.missingSessionCount} session${aggregate.missingSessionCount === 1 ? "" : "s"} missing from analytics`,
    );
  }

  return (
    <PageShell maxWidth="wide">
      {breadcrumbs}
      <PageHeader
        title={longDate}
        titleAccessory={
          aggregate?.preliminary ? (
            <StatusPill tone="warn" dot>
              Provisional
            </StatusPill>
          ) : undefined
        }
        subtitle={subtitleParts.join(" · ")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/z-report/${date}`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              Print / download
            </Link>
          </Button>
        }
      />

      <PageBody>
        <VfdStatusNote availability={day.vfdAvailability} error={day.vfdError} />
        <ZReportDayView day={day} />
      </PageBody>
    </PageShell>
  );
}
