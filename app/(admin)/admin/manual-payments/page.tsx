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
import { listManualPayments } from "@/lib/actions/admin/billing";
import type { ManualPaymentPage, ManualPaymentStatus } from "@/types/admin/billing";

export const metadata = {
  title: "Pending Payments",
};

interface ManualPaymentsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

function parseStatus(value: string | undefined): ManualPaymentStatus | "ALL" {
  if (value === "PENDING" || value === "APPROVED") {
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
            title="Pending Payments"
            subtitle="Restricted to billing approvers (System Admin, Super Admin, Finance)."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  // The shared DataTable owns pagination via a 1-based `?page` + `?limit`;
  // convert to the backend's 0-based index.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);

  let queue: ManualPaymentPage | null = null;
  let pendingCount = 0;
  let approvedCount = 0;
  let allCount = 0;
  let loadError: string | null = null;
  try {
    // Run the visible-page query and both status counts in parallel. Counts
    // query only the first page (size=1) and read totalElements — cheap and
    // means the tab badges are always accurate without a dedicated counts
    // endpoint on the backend.
    const listStatus = status === "ALL" ? undefined : status;
    const [pageData, pendingPage, approvedPage, allPage] = await Promise.all([
      listManualPayments({ status: listStatus, page: backendPage, size }),
      listManualPayments({ status: "PENDING", size: 1 }),
      listManualPayments({ status: "APPROVED", size: 1 }),
      listManualPayments({ size: 1 }),
    ]);
    queue = pageData;
    pendingCount = pendingPage.totalElements;
    approvedCount = approvedPage.totalElements;
    allCount = allPage.totalElements;
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load manual payments.";
  }

  const counts: Record<ManualPaymentStatus | "ALL", number> = {
    PENDING: pendingCount,
    APPROVED: approvedCount,
    ALL: allCount,
  };

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Pending Payments"
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
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
