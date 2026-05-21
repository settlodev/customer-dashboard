import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { BusinessesListView } from "@/components/admin/businesses-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { listAdminBusinesses } from "@/lib/actions/admin/businesses";
import { getBusinessLifecycleBatch } from "@/lib/actions/admin/business-intel";
import type { AdminBusinessPage } from "@/types/admin/business";
import type { BusinessLifecycleSnapshot } from "@/types/admin/business-intel";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Businesses",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface BusinessesPageProps {
  searchParams: Promise<{
    page?: string;
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

  const role = token.internalRole;
  const canRead = role ? READ_ROLES.includes(role) : false;
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
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);
  const search = params.search?.trim() || undefined;
  const accountId = params.accountId?.trim() || undefined;
  const status = params.status;
  const active =
    status === "active" ? true : status === "inactive" ? false : undefined;

  let pageData: AdminBusinessPage | null = null;
  let loadError: string | null = null;
  try {
    pageData = await listAdminBusinesses({
      page,
      size: 20,
      search,
      active,
      accountId,
    });
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load businesses.";
  }

  // Lifecycle batch — best-effort. A failure here shouldn't block the list;
  // the column simply renders "—" for every row instead.
  let lifecycleByBusinessId: Record<string, BusinessLifecycleSnapshot> = {};
  if (pageData && pageData.content.length > 0) {
    try {
      lifecycleByBusinessId = await getBusinessLifecycleBatch(
        pageData.content.map((b) => b.id),
      );
    } catch {
      // swallow — the column will just show "—" for every row
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
              initialSearch={search ?? ""}
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
