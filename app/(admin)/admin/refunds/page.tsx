import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { RefundsQueueView } from "@/components/admin/billing/refunds-queue-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { listRefunds } from "@/lib/actions/admin/billing";
import type { RefundPage, RefundStatus } from "@/types/admin/billing";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Refunds",
};

const REFUND_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPPORT_AGENT"];

interface RefundsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

function parseStatus(value: string | undefined): RefundStatus | "ALL" {
  if (value === "PENDING" || value === "PROCESSED" || value === "REJECTED") {
    return value;
  }
  return "ALL";
}

export default async function AdminRefundsPage({
  searchParams,
}: RefundsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? REFUND_ROLES.includes(role) : false;
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Refunds"
            subtitle="Restricted to System Admins and Support Agents."
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

  let queue: RefundPage | null = null;
  let pendingCount = 0;
  let processedCount = 0;
  let rejectedCount = 0;
  let allCount = 0;
  let loadError: string | null = null;
  try {
    // Run the visible-page query and all four status counts in parallel.
    // Counts query only the first page (size=1) and read totalElements —
    // cheap and means the tab badges are always accurate without needing
    // a dedicated counts endpoint on the backend.
    // `status === "ALL"` narrows to "PENDING" | "PROCESSED" | "REJECTED"
    // (legacy "APPROVED" was filtered out in parseStatus). Cast explicitly
    // so the action's tighter param type matches.
    const listStatus =
      status === "ALL"
        ? undefined
        : (status as "PENDING" | "PROCESSED" | "REJECTED");
    const [pageData, pendingPage, processedPage, rejectedPage, allPage] =
      await Promise.all([
        listRefunds({ status: listStatus, page: backendPage, size }),
        listRefunds({ status: "PENDING", size: 1 }),
        listRefunds({ status: "PROCESSED", size: 1 }),
        listRefunds({ status: "REJECTED", size: 1 }),
        listRefunds({ size: 1 }),
      ]);
    queue = pageData;
    pendingCount = pendingPage.totalElements;
    processedCount = processedPage.totalElements;
    rejectedCount = rejectedPage.totalElements;
    allCount = allPage.totalElements;
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load refunds.";
  }

  const counts: Record<RefundStatus | "ALL", number> = {
    PENDING: pendingCount,
    PROCESSED: processedCount,
    APPROVED: processedCount,
    REJECTED: rejectedCount,
    ALL: allCount,
  };

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Refunds"
          subtitle="Triage refund requests across all businesses. Approving processes the refund and reverses any included credits; rejecting leaves the invoice paid."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <RefundsQueueView
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
