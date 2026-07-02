import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { LoanDisbursementPanel } from "@/components/admin/loan-disbursement-panel";
import { LoanLifecyclePanel } from "@/components/admin/loan-lifecycle-panel";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import {
  getLoan,
  getLoanProduct,
  listFundingSources,
  listLoanDisbursements,
  listPayoutAccounts,
} from "@/lib/actions/admin/loans";
import {
  DISBURSEMENT_STATUS_LABELS,
  DISBURSEMENT_STATUS_TONES,
  fmtAmount,
  isLiveLoan,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  type DisbursementResponse,
  type FundingSourceResponse,
  type LoanProductResponse,
  type LoanResponse,
  type PayoutAccountResponse,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loan" };

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
      <div className={cn("mt-1 text-sm text-ink", mono && "font-mono tabular-nums")}>
        {children}
      </div>
    </div>
  );
}

export default async function AdminLoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  const canView = hasInternalPermission(
    token,
    PERM.LOANS_APPLICATIONS_READ,
    PERM.LOANS_READ,
  );
  const canDisburse = hasInternalPermission(token, PERM.LOANS_DISBURSE);
  const canWriteOff = hasInternalPermission(token, PERM.LOANS_WRITE_OFF);

  if (!canView) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loan"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let loan: LoanResponse | null = null;
  try {
    loan = await getLoan(id);
  } catch {
    loan = null;
  }
  if (!loan) notFound();

  let product: LoanProductResponse | null = null;
  try {
    product = await getLoanProduct(loan.loanProductId);
  } catch {
    product = null;
  }

  // Disbursement inputs are only needed (and permitted) for a disbursing officer.
  const pending = loan.status === "PENDING_DISBURSEMENT";
  let fundingSources: FundingSourceResponse[] = [];
  let payoutAccounts: PayoutAccountResponse[] = [];
  let disbursements: DisbursementResponse[] = [];
  if (canDisburse) {
    const [fs, pa, ds] = await Promise.allSettled([
      listFundingSources({ size: 100 }),
      listPayoutAccounts(loan.businessId),
      listLoanDisbursements(loan.id),
    ]);
    if (fs.status === "fulfilled") fundingSources = fs.value.content ?? [];
    if (pa.status === "fulfilled") payoutAccounts = pa.value.content ?? [];
    if (ds.status === "fulfilled") disbursements = ds.value ?? [];
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Loans", href: "/loans/portfolio" },
            { title: loan.loanNumber },
          ]}
        />
        <PageHeader
          title={loan.loanNumber}
          subtitle={product?.name ?? "Loan"}
          actions={
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                LOAN_STATUS_TONES[loan.status],
              )}
            >
              {LOAN_STATUS_LABELS[loan.status]}
            </span>
          }
        />
        <PageBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Loan facts */}
            <div className="space-y-4 lg:col-span-2">
              <section className="rounded-xl border border-line bg-card">
                <header className="border-b border-line px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-ink">Loan</h3>
                </header>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                  <Field label="Principal" mono>
                    {fmtAmount(loan.principal)} {loan.currency}
                  </Field>
                  <Field label="Fee" mono>
                    {fmtAmount(loan.feeAmount)}
                  </Field>
                  <Field label="Interest" mono>
                    {fmtAmount(loan.interestAmount)}
                  </Field>
                  <Field label="Total receivable" mono>
                    {fmtAmount(loan.totalReceivable)}
                  </Field>
                  <Field label="Outstanding" mono>
                    {fmtAmount(loan.outstandingTotal)}
                  </Field>
                  <Field label="Term" mono>
                    {loan.termDays} days · {loan.installmentCount} inst.
                  </Field>
                  <Field label="Business" mono>
                    ••{loan.businessId.slice(-8)}
                  </Field>
                  <Field label="Start date">
                    {loan.startDate
                      ? new Date(loan.startDate).toLocaleDateString()
                      : "—"}
                  </Field>
                  <Field label="Application">
                    <Link
                      href={`/loans/applications/${loan.applicationId}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </Field>
                </div>
              </section>

              {/* Disbursement history */}
              {disbursements.length > 0 ? (
                <section className="rounded-xl border border-line bg-card">
                  <header className="border-b border-line px-5 py-3.5">
                    <h3 className="text-sm font-semibold text-ink">
                      Disbursements
                    </h3>
                  </header>
                  <div className="divide-y divide-line">
                    {disbursements.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between px-5 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-mono tabular-nums text-ink">
                            {fmtAmount(d.amount)} {loan.currency}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {d.externalRef ?? d.providerRef ?? d.method}
                            {d.failureReason ? ` · ${d.failureReason}` : ""}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            DISBURSEMENT_STATUS_TONES[d.status],
                          )}
                        >
                          {DISBURSEMENT_STATUS_LABELS[d.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Disbursement action */}
            <div className="lg:col-span-1">
              {pending ? (
                canDisburse ? (
                  <LoanDisbursementPanel
                    loan={loan}
                    fundingSources={fundingSources}
                    payoutAccounts={payoutAccounts}
                    disbursements={disbursements}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-line-2 bg-card p-5 text-sm text-muted-foreground">
                    This loan is pending disbursement, but releasing funds needs
                    the <span className="font-mono">loans:disburse</span>{" "}
                    permission.
                  </div>
                )
              ) : isLiveLoan(loan.status) && canWriteOff ? (
                <LoanLifecyclePanel loan={loan} />
              ) : (
                <div className="rounded-xl border border-dashed border-line-2 bg-card p-5 text-sm text-muted-foreground">
                  No action available — this loan is{" "}
                  {LOAN_STATUS_LABELS[loan.status].toLowerCase()}.
                </div>
              )}
            </div>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
