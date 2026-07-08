import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { LoanActiveToggle } from "@/components/admin/loan-active-toggle";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { listFundingSources } from "@/lib/actions/admin/loans";
import {
  DISBURSEMENT_METHOD_LABELS,
  fmtAmount,
  FUNDING_SOURCE_TYPE_LABELS,
  type FundingSourceResponse,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funding sources" };

export default async function AdminFundingSourcesPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_FUNDING_MANAGE)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Funding sources"
            subtitle="You don't have permission to manage funding sources."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let sources: FundingSourceResponse[] = [];
  let loadError: string | null = null;
  try {
    const page = await listFundingSources({ size: 100 });
    sources = page.content ?? [];
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load funding sources.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Funding sources"
          subtitle="Capital pools disbursements draw from, and their available capacity."
          actions={
            <Button asChild>
              <Link href="/loans/funding-sources/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New source
              </Link>
            </Button>
          }
        />
        <PageBody>
          {loadError ? (
            <div className="rounded-xl border border-neg/30 bg-neg/5 px-4 py-3 text-sm text-neg">
              {loadError}
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
              No funding sources yet. Add one so loans can be disbursed.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Limit</th>
                      <th className="px-4 py-3 text-right">Available</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sources.map((s) => (
                      <tr key={s.id} className="hover:bg-canvas/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/loans/funding-sources/${s.id}`}
                            className="font-medium text-ink hover:text-primary hover:underline"
                          >
                            {s.name}
                          </Link>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {FUNDING_SOURCE_TYPE_LABELS[s.type]} · {s.currency}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {DISBURSEMENT_METHOD_LABELS[s.disbursementMethod]}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {s.capitalLimit == null
                            ? "Unlimited"
                            : fmtAmount(s.capitalLimit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {s.availableCapacity == null
                            ? "—"
                            : fmtAmount(s.availableCapacity)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              s.active
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500",
                            )}
                          >
                            {s.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <LoanActiveToggle
                            kind="funding"
                            id={s.id}
                            name={s.name}
                            active={s.active}
                          />
                        </td>
                      </tr>
                    ))}
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
