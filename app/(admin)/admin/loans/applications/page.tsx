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
import {
  listLoanApplications,
  listLoanProducts,
  resolveBusinessDirectory,
  type BusinessRef,
} from "@/lib/actions/admin/loans";
import {
  APPLICATION_STATUS_FILTERS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  fmtAmount,
  type ApplicationStatus,
  type LoanApplicationResponse,
  type LoanProductResponse,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loan applications" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const TABS: string[] = [...APPLICATION_STATUS_FILTERS, "ALL"];

export default async function AdminLoanApplicationsPage({
  searchParams,
}: PageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_APPLICATIONS_READ)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loan applications"
            subtitle="You don't have permission to review loan applications."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { status: statusParam } = await searchParams;
  const raw = (statusParam ?? "IN_REVIEW").toUpperCase();
  const valid =
    raw === "ALL" ||
    APPLICATION_STATUS_FILTERS.includes(raw as ApplicationStatus);
  const activeFilter = valid ? raw : "IN_REVIEW";
  const statusForQuery =
    activeFilter === "ALL" ? undefined : (activeFilter as ApplicationStatus);

  let applications: LoanApplicationResponse[] = [];
  let products = new Map<string, LoanProductResponse>();
  let directory: Record<string, BusinessRef> = {};
  let loadError: string | null = null;
  try {
    const [apps, prodPage] = await Promise.all([
      listLoanApplications({ status: statusForQuery, size: 100 }),
      listLoanProducts({ size: 200 }),
    ]);
    applications = apps.content ?? [];
    products = new Map((prodPage.content ?? []).map((p) => [p.id, p]));
    directory = await resolveBusinessDirectory(
      applications.map((a) => a.businessId),
    );
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load loan applications.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Loan applications"
          subtitle="Review submitted financing applications and record approval decisions."
        />
        <PageBody>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const isActive = activeFilter === t;
              const label =
                t === "ALL"
                  ? "All"
                  : APPLICATION_STATUS_LABELS[t as ApplicationStatus];
              return (
                <Link
                  key={t}
                  href={`/loans/applications?status=${t}`}
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
          ) : applications.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
              No applications
              {activeFilter !== "ALL"
                ? ` with status “${
                    APPLICATION_STATUS_LABELS[activeFilter as ApplicationStatus]
                  }”`
                : ""}
              .
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Application</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Requested</th>
                      <th className="px-4 py-3 text-right">Term</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {applications.map((a) => {
                      const product = products.get(a.loanProductId);
                      return (
                        <tr key={a.id} className="hover:bg-canvas/60">
                          <td className="px-4 py-3">
                            <Link
                              href={`/loans/applications/${a.id}`}
                              className="font-medium text-ink hover:text-primary hover:underline"
                            >
                              {a.applicationNumber}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {directory[a.businessId]?.name ??
                                `biz ••${a.businessId.slice(-6)}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product?.name ?? (
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {a.loanProductId.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmtAmount(a.requestedAmount)}
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              {product?.currency ?? ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {a.requestedTermDays}d
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                APPLICATION_STATUS_TONES[a.status],
                              )}
                            >
                              {APPLICATION_STATUS_LABELS[a.status]}
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
