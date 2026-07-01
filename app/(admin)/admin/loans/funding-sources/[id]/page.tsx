import { notFound, redirect } from "next/navigation";

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
import { getFundingSource } from "@/lib/actions/admin/loans";
import type { FundingSourceResponse } from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funding source" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFundingSourcePage({ params }: PageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_FUNDING_MANAGE)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Funding source"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let source: FundingSourceResponse | null = null;
  try {
    source = await getFundingSource(id);
  } catch {
    source = null;
  }
  if (!source) notFound();

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Funding sources", href: "/loans/funding-sources" },
            { title: source.name },
          ]}
        />
        <PageHeader title={source.name} subtitle={`${source.type} · ${source.currency}`} />
        <PageBody>
          <FundingSourceForm item={source} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
