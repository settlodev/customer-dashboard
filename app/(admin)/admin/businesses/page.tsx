import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { BusinessesListView } from "@/components/admin/businesses-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  getBusinessStatusCounts,
  listAdminBusinesses,
} from "@/lib/actions/admin/businesses";
import { getBusinessLifecycleBatch } from "@/lib/actions/admin/business-intel";
import type {
  AdminBusinessPage,
  BusinessStatusCounts,
} from "@/types/admin/business";
import type { BusinessLifecycleSnapshot } from "@/types/admin/business-intel";

export const metadata = {
  title: "Businesses",
};

interface BusinessesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    accountId?: string;
  }>;
}

export default async function AdminBusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canRead = hasInternalPermission(token, PERM.ACCOUNTS_READ);
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Businesses"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  // DataTable uses 1-indexed `?page=` in the URL; the backend is 0-indexed.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "10", 10) || 10);
  const search = params.search?.trim() || undefined;
  const accountId = params.accountId?.trim() || undefined;
  const status = params.status;
  const active =
    status === "active" ? true : status === "inactive" ? false : undefined;

  let pageData: AdminBusinessPage | null = null;
  let counts: BusinessStatusCounts = { total: 0, active: 0, inactive: 0 };
  let loadError: string | null = null;
  try {
    [pageData, counts] = await Promise.all([
      listAdminBusinesses({
        page: backendPage,
        size,
        search,
        active,
        accountId,
      }),
      getBusinessStatusCounts({ search, accountId }),
    ]);
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load businesses.";
  }

  // Lifecycle batch — best-effort. A failure here shouldn't block the list;
  // the column simply renders "No data" for every row instead.
  let lifecycleByBusinessId: Record<string, BusinessLifecycleSnapshot> = {};
  if (pageData && pageData.content.length > 0) {
    try {
      lifecycleByBusinessId = await getBusinessLifecycleBatch(
        pageData.content.map((b) => b.id),
      );
    } catch {
      // swallow — the column will just show "No data" for every row
    }
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Businesses"
          subtitle={
            accountId
              ? `Filtered to account · ${accountId}`
              : "Browse businesses across all accounts and whitelabels."
          }
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <BusinessesListView
              initialPage={pageData!}
              counts={counts}
              initialStatus={status ?? "all"}
              accountId={accountId ?? null}
              lifecycleByBusinessId={lifecycleByBusinessId}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
