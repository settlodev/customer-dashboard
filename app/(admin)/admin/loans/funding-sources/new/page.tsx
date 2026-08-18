import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import FundingSourceForm from "@/components/forms/funding-source-form";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "New funding source" };

export default async function NewFundingSourcePage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_FUNDING_MANAGE)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="New funding source"
            subtitle="You don't have permission to manage funding sources."
          />
        </PageShell>
      </AdminShell>
    );
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Funding sources", href: "/loans/funding-sources" },
            { title: "New" },
          ]}
        />
        <PageHeader
          title="New funding source"
          subtitle="Register a capital pool that loans can be disbursed from."
        />
        <PageBody>
          <FundingSourceForm item={null} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
