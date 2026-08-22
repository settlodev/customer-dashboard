import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import { PageBody, PageHeader, PageShell } from "@/components/layouts/page-shell";
import { AppCampaignsView } from "@/components/admin/app-campaigns/app-campaigns-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listAppCampaigns } from "@/lib/actions/admin/app-campaigns";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "App Campaigns",
};

export default async function AppCampaignsPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canManage = hasInternalPermission(token, PERM.APP_CAMPAIGN_MANAGE);

  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="App Campaigns"
            subtitle="You don't have permission to manage app campaigns."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const campaigns = await listAppCampaigns();

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="App Campaigns"
          subtitle="Seasonal POS app icons and top-bar messages, pushed to every till."
        />
        <PageBody>
          <AppCampaignsView campaigns={campaigns} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
