import { notFound } from "next/navigation";
import Link from "next/link";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import DataLoadError from "@/components/layouts/data-load-error";
import NoItems from "@/components/layouts/no-items";
import { softFetch } from "@/lib/list-fallback";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { ensureLoanAccess } from "@/lib/loans/access";
import { LOAN_PERMISSIONS } from "@/lib/loans/permissions";
import { listMyApplications } from "@/lib/actions/loan-applications-actions";
import { formatTzs } from "@/types/loans/type";
import type { LoanApplication } from "@/types/loans/applications";
import { ApplicationStatusBadge } from "@/components/loans/application-status-badge";

export default async function LoanApplicationsPage() {
  if (!LOANS_ENABLED) notFound();
  await ensureLoanAccess(LOAN_PERMISSIONS.read);

  const applications = await softFetch(listMyApplications());

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Financing" },
          { title: "Loans", href: "/loans" },
          { title: "Applications" },
        ]}
      />
      <PageHeader
        title="Loan applications"
        subtitle="Track your financing applications and accept offers."
      />
      <PageBody>
        {!applications ? (
          <DataLoadError itemName="loan applications" />
        ) : applications.length === 0 ? (
          <NoItems itemName="loan applications" />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((a) => (
              <ApplicationCard key={a.id} application={a} />
            ))}
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}

function ApplicationCard({ application: a }: { application: LoanApplication }) {
  const amount = a.approvedAmount ?? a.requestedAmount;
  const termDays = a.approvedTermDays ?? a.requestedTermDays;

  return (
    <Link
      href={`/loans/applications/${a.id}`}
      className="block rounded-xl border border-line bg-card p-[18px] transition-all hover:border-line-2 hover:shadow-[0_4px_14px_-6px_rgba(20,17,12,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-muted-foreground">
            {a.applicationNumber}
          </div>
          <div className="mt-1 truncate text-[15px] font-bold tracking-tight text-ink">
            {a.purpose ?? "Financing application"}
          </div>
        </div>
        <ApplicationStatusBadge status={a.status} />
      </div>

      <div className="mt-4 text-[20px] font-bold tracking-tight text-ink">
        {formatTzs(amount)}
        <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
          {a.approvedAmount != null ? "approved" : "requested"}
        </span>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {termDays} days
      </div>
    </Link>
  );
}
