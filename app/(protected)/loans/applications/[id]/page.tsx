import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { ensureLoanAccess, getLoanAccess } from "@/lib/loans/access";
import { LOAN_PERMISSIONS } from "@/lib/loans/permissions";
import { getMyApplication } from "@/lib/actions/loan-applications-actions";
import { getSupplierOrderLpoId } from "@/lib/actions/lpo-actions";
import { FINANCING_BACKEND_READY } from "@/lib/actions/loans-client";
import { ApplicationStatusBadge } from "@/components/loans/application-status-badge";

import { ApplicationDetailClient } from "./application-detail-client";

type Params = Promise<{ id: string }>;

export default async function LoanApplicationDetailPage({
  params,
}: {
  params: Params;
}) {
  if (!LOANS_ENABLED) notFound();
  await ensureLoanAccess(LOAN_PERMISSIONS.read);

  const { id } = await params;

  const application = await getMyApplication(id);
  if (!application) notFound();

  const [{ canApply }, lpoId] = await Promise.all([
    getLoanAccess(),
    application.supplierOrderId
      ? getSupplierOrderLpoId(application.supplierOrderId)
      : Promise.resolve<string | null>(null),
  ]);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Financing" },
          { title: "Loans", href: "/loans" },
          { title: "Applications", href: "/loans/applications" },
          { title: application.applicationNumber },
        ]}
      />
      <PageHeader
        title={application.applicationNumber}
        subtitle={application.purpose ?? "Loan application"}
        titleAccessory={
          <ApplicationStatusBadge status={application.status} />
        }
      />
      <PageBody>
        <ApplicationDetailClient
          application={application}
          canApply={canApply}
          lpoId={lpoId}
          loanDetailReady={FINANCING_BACKEND_READY}
        />
      </PageBody>
    </PageShell>
  );
}
