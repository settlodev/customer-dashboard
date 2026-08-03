import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { formatDate } from "@/components/admin/shared/format";
import { NominationStatusBadge } from "@/components/admin/settlo-suppliers/nomination-status-badge";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { listNominations } from "@/lib/actions/admin/supplier-nominations";
import {
  NOMINATION_STATUS_LABELS,
  type NominationReview,
  type NominationStatus,
} from "@/types/supplier/nomination";

// Driven by `?status=`; force dynamic rendering so a tab change always
// re-runs this Server Component with the new param instead of serving a
// prefetched, param-less copy from the Router Cache.
export const dynamic = "force-dynamic";
export const metadata = { title: "Supplier nominations" };

// Only the statuses staff triage day-to-day get a tab — WITHDRAWN (the
// merchant pulled it back before review) has nothing to action and is
// reachable only by direct link, not from this queue.
const STATUS_TABS: NominationStatus[] = ["SUBMITTED", "APPROVED", "REJECTED"];
const DEFAULT_STATUS: NominationStatus = "SUBMITTED";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminNominationsPage({
  searchParams,
}: PageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.ACCOUNTS_READ)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Supplier nominations"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { status: statusParam } = await searchParams;
  const raw = statusParam?.toUpperCase();
  const activeStatus: NominationStatus =
    raw && STATUS_TABS.includes(raw as NominationStatus)
      ? (raw as NominationStatus)
      : DEFAULT_STATUS;

  let nominations: NominationReview[] = [];
  let loadError: string | null = null;
  try {
    nominations = await listNominations(activeStatus);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load nominations.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Supplier nominations"
          subtitle="Merchant-submitted suppliers awaiting review for the Settlo directory."
        />
        <PageBody>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((status) => {
              const isActive = activeStatus === status;
              const href =
                status === DEFAULT_STATUS
                  ? "/settlo-suppliers/nominations"
                  : `/settlo-suppliers/nominations?status=${status}`;
              return (
                <Link
                  key={status}
                  href={href}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-card text-ink-3 hover:bg-canvas hover:text-ink",
                  )}
                >
                  {NOMINATION_STATUS_LABELS[status]}
                </Link>
              );
            })}
          </div>

          {loadError ? (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : nominations.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
              No nominations to review.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3">Submitting business</th>
                      <th className="px-4 py-3">TIN</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {nominations.map((n) => (
                      <tr key={n.id} className="hover:bg-canvas/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/settlo-suppliers/nominations/${n.id}`}
                            className="font-medium text-ink hover:text-primary hover:underline"
                          >
                            {n.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-mono text-[11px] text-muted-foreground"
                            title={n.businessId}
                          >
                            {n.businessId.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-3">
                          {n.tinNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-ink-3">
                          {formatDate(n.submittedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <NominationStatusBadge status={n.status} />
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
