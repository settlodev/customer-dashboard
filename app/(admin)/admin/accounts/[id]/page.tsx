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
import { getAccountDetail } from "@/lib/actions/admin/accounts";
import { getAccountInsights } from "@/lib/actions/admin/account-insights";
import { AdminAccountDetail } from "@/types/admin/account";
import { InternalRole } from "@/types/types";

export const metadata = {
  title: "Account detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

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

  const role = token.internalRole;
  const canRead = role ? READ_ROLES.includes(role) : false;
  const canSuspend = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  const canDelete = role === "SYSTEM_ADMIN";
  const canAssignStaff = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  // Marking an account internal hides it from platform metrics — same gate as
  // suspend/manage (backend: INTERNAL_internal:accounts:manage).
  const canManage = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
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
