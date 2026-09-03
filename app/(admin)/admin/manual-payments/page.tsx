import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { ManualPaymentsQueueView } from "@/components/admin/billing/manual-payments-queue-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listManualPayments, summarizeManualPayments } from "@/lib/actions/admin/billing";
import {
  listInternalStaffProfiles,
  listInternalUsers,
} from "@/lib/actions/admin/internal-users";
import { buildActorNameMap } from "@/lib/admin/actor-names";
import { endOfBusinessDayIso, startOfBusinessDayIso } from "@/lib/format-datetime";
import type {
  ManualPaymentPage,
  ManualPaymentsSummary,
  ManualPaymentStatus,
} from "@/types/admin/billing";

export const metadata = {
  title: "Manual Payments",
};

interface ManualPaymentsPageProps {
  searchParams: Promise<{
    status?: string;
    recordedFrom?: string;
    recordedTo?: string;
    page?: string;
    limit?: string;
  }>;
}

/** `YYYY-MM-DD` sanity check — anything else is dropped rather than sent upstream. */
function parseDateOnly(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function parseStatus(value: string | undefined): ManualPaymentStatus | "ALL" {
  if (value === "PENDING" || value === "APPROVED" || value === "CANCELLED") {
    return value;
  }
  return "ALL";
}

export default async function AdminManualPaymentsPage({
  searchParams,
}: ManualPaymentsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canReview = hasInternalPermission(token, PERM.BILLING_INVOICES_APPROVE);
  if (!canReview) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Manual Payments"
            subtitle="Restricted to billing approvers (System Admin, Super Admin, Finance)."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const recordedFromDay = parseDateOnly(params.recordedFrom);
  const recordedToDay = parseDateOnly(params.recordedTo);
  const recordedFrom = recordedFromDay ? startOfBusinessDayIso(recordedFromDay) : undefined;
  const recordedTo = recordedToDay ? endOfBusinessDayIso(recordedToDay) : undefined;
  // The shared DataTable owns pagination via a 1-based `?page` + `?limit`;
  // convert to the backend's 0-based index.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);

  let queue: ManualPaymentPage | null = null;
  let pendingCount = 0;
  let approvedCount = 0;
  let cancelledCount = 0;
  let allCount = 0;
  let actorNames: Record<string, string> = {};
  let summary: ManualPaymentsSummary = { totalAmount: 0, totalInvoices: 0 };
  let loadError: string | null = null;
  try {
    // Run the visible-page query, all three status counts, and the summary banner in
    // parallel. Counts query only the first page (size=1) and read totalElements —
    // cheap and means the tab badges are always accurate without a
    // dedicated counts endpoint on the backend. The summary reflects the active tab
    // (or "ALL") and date range, same as the visible page. Staff directories resolve
    // `recordedBy` (an Auth user id) to a human name for the "Requested by"
    // column — failures there shouldn't block the queue, so they're best-effort.
    const listStatus = status === "ALL" ? undefined : status;
    const [pageData, pendingPage, approvedPage, cancelledPage, allPage, summaryData, internalUsers, staffProfiles] =
      await Promise.all([
        listManualPayments({ status: listStatus, recordedFrom, recordedTo, page: backendPage, size }),
        listManualPayments({ status: "PENDING", recordedFrom, recordedTo, size: 1 }),
        listManualPayments({ status: "APPROVED", recordedFrom, recordedTo, size: 1 }),
        listManualPayments({ status: "CANCELLED", recordedFrom, recordedTo, size: 1 }),
        listManualPayments({ recordedFrom, recordedTo, size: 1 }),
        summarizeManualPayments({ status: listStatus, recordedFrom, recordedTo }),
        listInternalUsers().catch(() => []),
        listInternalStaffProfiles().catch(() => []),
      ]);
    queue = pageData;
    pendingCount = pendingPage.totalElements;
    approvedCount = approvedPage.totalElements;
    cancelledCount = cancelledPage.totalElements;
    allCount = allPage.totalElements;
    summary = summaryData;
    actorNames = buildActorNameMap(internalUsers, staffProfiles);
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load manual payments.";
  }

  const counts: Record<ManualPaymentStatus | "ALL", number> = {
    PENDING: pendingCount,
    APPROVED: approvedCount,
    CANCELLED: cancelledCount,
    ALL: allCount,
  };

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Manual Payments"
          subtitle="Review manual payments recorded without approval authority across all businesses. Approving marks the invoice paid and activates the subscription."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <ManualPaymentsQueueView
              page={queue!}
              status={status}
              counts={counts}
              summary={summary}
              actorNames={actorNames}
              recordedFrom={recordedFromDay}
              recordedTo={recordedToDay}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
