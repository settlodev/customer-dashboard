import { notFound } from "next/navigation";

import { getCurrentDestination } from "@/lib/actions/context";
import {
  getCloseOfDayExtras,
  getDaySessionDetail,
} from "@/lib/actions/day-session-list-actions";
import { listPaymentMethodReconciliations } from "@/lib/actions/payment-method-reconciliation-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import type { Staff } from "@/types/staff";
import { resolveCurrency } from "@/lib/day-sessions/cod-format";
import { ReportPrintFrame } from "@/components/widgets/day-sessions/report-print-frame";
import { CloseOfDayReportSheet } from "@/components/widgets/day-sessions/close-of-day-report-sheet";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for the Close-of-Day report — the
 * formal Z-report an owner or duty manager prints or saves as PDF at
 * close. Mirrors the GRN print route: chrome-free `(printables)` group,
 * server component, `Promise.all` fan-out over the COD sources plus the
 * active-destination letterhead. Opened in a new tab from the session
 * dashboard's "Shareable report" button.
 */
export default async function CloseOfDayReportPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const destination = await getCurrentDestination();
  if (!destination || destination.type !== "LOCATION") notFound();
  const locationId = destination.id;

  const [detail, reconciliations, extras, staffList, letterhead] =
    await Promise.all([
      getDaySessionDetail(locationId, id),
      listPaymentMethodReconciliations(id),
      getCloseOfDayExtras(locationId, id),
      fetchAllStaff().catch(() => [] as Staff[]),
      getLetterhead().catch(() => null),
    ]);

  if (!detail.session) notFound();
  const { session, report } = detail;

  const roster = new Map(staffList.map((s): [string, Staff] => [s.id, s]));

  const currency = resolveCurrency(
    reconciliations.find((r) => r.currency)?.currency,
    extras.expenses?.items[0]?.currencyCode,
    extras.prepayments?.items[0]?.currency,
    extras.refunds?.refunds[0]?.refundCurrency,
  );

  const documentTitle = `${session.identifier ?? "Close of Day"} — Close of Day Report`;

  return (
    <ReportPrintFrame documentTitle={documentTitle}>
      <CloseOfDayReportSheet
        session={session}
        report={report}
        reconciliations={reconciliations}
        extras={extras}
        letterhead={letterhead}
        roster={roster}
        currency={currency}
        generatedAt={new Date().toISOString()}
      />
    </ReportPrintFrame>
  );
}
