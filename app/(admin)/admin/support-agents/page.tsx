import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { SupportAgentsView } from "@/components/admin/support-agents-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listSupportAgents } from "@/lib/actions/admin/support-agents";
import type { SupportAgentPage } from "@/types/admin/support-agent";

export const metadata = {
  title: "External agents",
};

interface SupportAgentsPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function AdminSupportAgentsPage({
  searchParams,
}: SupportAgentsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);

  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="External agents"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  // The shared DataTable owns pagination via a 1-based `?page` + `?limit`;
  // convert to the backend's 0-based index.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);

  let pageData: SupportAgentPage | null = null;
  let loadError: string | null = null;
  try {
    pageData = await listSupportAgents(backendPage, size);
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load support agents.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="External / referral agents"
          subtitle="External agents (e.g. influencers/affiliates) with referral codes — assignable as an account's sales person. Support staff is internal."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <SupportAgentsView
              initialPage={pageData!}
              canManage={canManage}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
