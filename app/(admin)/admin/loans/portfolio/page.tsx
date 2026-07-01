import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { listLoanProducts, listLoans } from "@/lib/actions/admin/loans";
import {
  fmtAmount,
  LOAN_STATUS_FILTERS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  type LoanProductResponse,
  type LoanResponse,
  type LoanStatus,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loans" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const TABS: string[] = [...LOAN_STATUS_FILTERS, "ALL"];

export default async function AdminLoansPage({ searchParams }: PageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_APPLICATIONS_READ)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loans"
            subtitle="You don't have permission to view the loan book."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canDisburse = hasInternalPermission(token, PERM.LOANS_DISBURSE);

  const { status: statusParam } = await searchParams;
  const raw = (statusParam ?? "PENDING_DISBURSEMENT").toUpperCase();
  const valid =
    raw === "ALL" || LOAN_STATUS_FILTERS.includes(raw as LoanStatus);
  const activeFilter = valid ? raw : "PENDING_DISBURSEMENT";
  const statusForQuery =
    activeFilter === "ALL" ? undefined : (activeFilter as LoanStatus);

  let loans: LoanResponse[] = [];
  let products = new Map<string, LoanProductResponse>();
  let loadError: string | null = null;
  try {
    const [loanPage, prodPage] = await Promise.all([
      listLoans({ status: statusForQuery, size: 100 }),
      listLoanProducts({ size: 200 }),
    ]);
    loans = loanPage.content ?? [];
    products = new Map((prodPage.content ?? []).map((p) => [p.id, p]));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load loans.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Loans"
          subtitle="The loan book — disburse pending loans and track active financing."
        />
        <PageBody>
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const isActive = activeFilter === t;
              const label =
                t === "ALL" ? "All" : LOAN_STATUS_LABELS[t as LoanStatus];
              return (
                <Link
                  key={t}
                  href={`/loans/portfolio?status=${t}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-card text-ink-3 hover:bg-canvas hover:text-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {loadError ? (
            <div className="mt-4 rounded-xl border border-neg/30 bg-neg/5 px-4 py-3 text-sm text-neg">
              {loadError}
            </div>
          ) : loans.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
              No loans
              {activeFilter !== "ALL"
                ? ` with status “${LOAN_STATUS_LABELS[activeFilter as LoanStatus]}”`
                : ""}
              .
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Loan</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Principal</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {loans.map((l) => {
                      const product = products.get(l.loanProductId);
                      const pending = l.status === "PENDING_DISBURSEMENT";
                      return (
                        <tr key={l.id} className="hover:bg-canvas/60">
                          <td className="px-4 py-3">
                            <Link
                              href={`/loans/portfolio/${l.id}`}
                              className="font-medium text-ink hover:text-primary hover:underline"
                            >
                              {l.loanNumber}
                            </Link>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              biz ••{l.businessId.slice(-6)}
                              {pending && canDisburse ? (
                                <span className="ml-2 text-primary">
                                  · ready to disburse
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product?.name ?? (
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {l.loanProductId.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmtAmount(l.principal)}
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              {l.currency}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmtAmount(l.outstandingTotal)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                LOAN_STATUS_TONES[l.status],
                              )}
                            >
                              {LOAN_STATUS_LABELS[l.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
