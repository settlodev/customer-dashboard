import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { LoanApplicationDecisionPanel } from "@/components/admin/loan-application-decision-panel";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { getLoanApplication, getLoanProduct } from "@/lib/actions/admin/loans";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  fmtAmount,
  isDecidable,
  type LoanApplicationResponse,
  type LoanProductResponse,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loan application" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-sm text-ink",
          mono && "font-mono tabular-nums",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default async function AdminLoanApplicationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  const canView = hasInternalPermission(
    token,
    PERM.LOANS_APPLICATIONS_READ,
    PERM.LOANS_READ,
  );
  const canApprove = hasInternalPermission(token, PERM.LOANS_APPROVE);

  if (!canView) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loan application"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let application: LoanApplicationResponse | null = null;
  try {
    application = await getLoanApplication(id);
  } catch {
    application = null;
  }
  if (!application) notFound();

  // Product is best-effort — a deleted product shouldn't 404 the application.
  let product: LoanProductResponse | null = null;
  try {
    product = await getLoanProduct(application.loanProductId);
  } catch {
    product = null;
  }
  const currency = product?.currency ?? "TZS";
  const decided = Boolean(application.decisionedAt);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Loan applications", href: "/loans/applications" },
            { title: application.applicationNumber },
          ]}
        />
        <PageHeader
          title={application.applicationNumber}
          subtitle={product?.name ?? "Loan application"}
          actions={
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                APPLICATION_STATUS_TONES[application.status],
              )}
            >
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
          }
        />
        <PageBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Details */}
            <div className="space-y-4 lg:col-span-2">
              <section className="rounded-xl border border-line bg-card">
                <header className="border-b border-line px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-ink">Request</h3>
                </header>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                  <Field label="Product">
                    {product?.name ?? (
                      <span className="font-mono text-xs text-muted-foreground">
                        {application.loanProductId.slice(0, 8)}…
                      </span>
                    )}
                  </Field>
                  <Field label="Requested amount" mono>
                    {fmtAmount(application.requestedAmount)} {currency}
                  </Field>
                  <Field label="Requested term" mono>
                    {application.requestedTermDays} days
                  </Field>
                  <Field label="Business" mono>
                    ••{application.businessId.slice(-8)}
                  </Field>
                  <Field label="Account" mono>
                    ••{application.accountId.slice(-8)}
                  </Field>
                  <Field label="Status">
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </Field>
                  {application.purpose ? (
                    <div className="col-span-2 sm:col-span-3">
                      <Field label="Purpose">{application.purpose}</Field>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Decision summary (once decided) */}
              {decided ? (
                <section className="rounded-xl border border-line bg-card">
                  <header className="border-b border-line px-5 py-3.5">
                    <h3 className="text-sm font-semibold text-ink">Decision</h3>
                  </header>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                    {application.approvedAmount != null ? (
                      <Field label="Approved amount" mono>
                        {fmtAmount(application.approvedAmount)} {currency}
                      </Field>
                    ) : null}
                    {application.approvedTermDays != null ? (
                      <Field label="Approved term" mono>
                        {application.approvedTermDays} days
                      </Field>
                    ) : null}
                    <Field label="Decided at">
                      {application.decisionedAt
                        ? new Date(application.decisionedAt).toLocaleString()
                        : "—"}
                    </Field>
                    {application.decisionNotes ? (
                      <div className="col-span-2 sm:col-span-3">
                        <Field label="Notes">{application.decisionNotes}</Field>
                      </div>
                    ) : null}
                    {application.rejectionReason ? (
                      <div className="col-span-2 sm:col-span-3">
                        <Field label="Rejection reason">
                          {application.rejectionReason}
                        </Field>
                      </div>
                    ) : null}
                    {application.loanId ? (
                      <div className="col-span-2 sm:col-span-3">
                        <Field label="Loan" mono>
                          {application.loanId}
                        </Field>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Decision panel / hint */}
            <div className="lg:col-span-1">
              {isDecidable(application.status) ? (
                canApprove ? (
                  <LoanApplicationDecisionPanel
                    application={application}
                    currency={currency}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-line-2 bg-card p-5 text-sm text-muted-foreground">
                    This application is awaiting review, but recording a decision
                    needs the <span className="font-mono">loans:approve</span>{" "}
                    permission.
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-line-2 bg-card p-5 text-sm text-muted-foreground">
                  No action needed — only applications in review can be decided.
                </div>
              )}
            </div>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
