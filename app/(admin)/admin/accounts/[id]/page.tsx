import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AccountDetailView } from "@/components/admin/account-detail/account-detail-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { getAccountDetail } from "@/lib/actions/admin/accounts";
import { getAccountInsights } from "@/lib/actions/admin/account-insights";
import { getAccountStructure } from "@/lib/actions/admin/account-structure";
import { AdminAccountDetail } from "@/types/admin/account";

export const metadata = {
  title: "Account detail",
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAccountDetailPage({
  params,
}: DetailPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canRead = hasInternalPermission(token, PERM.ACCOUNTS_READ);
  const canSuspend = hasInternalPermission(token, PERM.ACCOUNTS_SUSPEND);
  const canDelete = hasInternalPermission(token, PERM.ACCOUNTS_DELETE);
  const canAssignStaff = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  // Marking an account internal hides it from platform metrics — same gate as
  // suspend/manage (backend: INTERNAL_internal:accounts:manage).
  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  // Resend verification mirrors the backend's :read authority — every internal
  // role that can open this page (incl. SUPPORT_AGENT) may resend.
  const canResend = canRead;

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Account detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { id } = await params;

  let account: AdminAccountDetail;
  try {
    account = await getAccountDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Account detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load account."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  // Commercial / health / support context is stubbed until the analytics
  // endpoints land — see lib/actions/admin/account-insights.ts.
  const insights = await getAccountInsights(id);
  const structure = await getAccountStructure(
    insights.businesses.items.map((b) => ({ id: b.id })),
  );

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Accounts", href: "/accounts" },
            { title: account.fullName || account.email },
          ]}
        />
        <AccountDetailView
          account={account}
          insights={insights}
          structure={structure}
          canSuspend={canSuspend}
          canDelete={canDelete}
          canAssignStaff={canAssignStaff}
          canResend={canResend}
          canManage={canManage}
        />
      </PageShell>
    </AdminShell>
  );
}
