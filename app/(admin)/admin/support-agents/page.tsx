import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { SupportAgentsView } from "@/components/admin/support-agents-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { listSupportAgents } from "@/lib/actions/admin/support-agents";
import type { SupportAgentPage } from "@/types/admin/support-agent";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Support agents",
};

const MANAGE_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPER_ADMIN"];

interface SupportAgentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminSupportAgentsPage({
  searchParams,
}: SupportAgentsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canManage = role ? MANAGE_ROLES.includes(role) : false;

  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Support agents"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);

  let pageData: SupportAgentPage | null = null;
  let loadError: string | null = null;
  try {
    pageData = await listSupportAgents(page, 20);
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load support agents.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Support agents"
          subtitle="External agents with referral codes for customer onboarding."
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
