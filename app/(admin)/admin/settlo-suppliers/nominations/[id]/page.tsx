import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { formatDateTime } from "@/components/admin/shared/format";
import { NominationStatusBadge } from "@/components/admin/settlo-suppliers/nomination-status-badge";
import { NominationDecisionClient } from "./nomination-decision-client";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { getNomination } from "@/lib/actions/admin/supplier-nominations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplier nomination" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminNominationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.ACCOUNTS_READ_ALL)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Supplier nomination"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);

  let nomination = null;
  try {
    nomination = await getNomination(id);
  } catch {
    nomination = null;
  }
  if (!nomination) notFound();

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Supplier nominations", href: "/settlo-suppliers/nominations" },
            { title: nomination.name },
          ]}
        />
        <PageHeader
          title={nomination.name}
          subtitle="Supplier nomination submitted for staff review."
          titleAccessory={<NominationStatusBadge status={nomination.status} />}
        />
        <PageBody>
          {nomination.sourceSupplierDeleted && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn-tint px-4 py-2.5 text-[12.5px] font-medium text-warn">
              <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
              <span>
                The merchant&apos;s supplier record was deleted — approving
                still creates the directory entry, but nothing will be linked
                back.
              </span>
            </div>
          )}

          <SectionCard title="Submitted details">
            <DefList>
              <DefRow
                label="Contact person"
                value={nomination.contactPerson ?? "—"}
              />
              <DefRow label="Phone" value={nomination.phone ?? "—"} />
              <DefRow
                label="Contact email"
                value={nomination.contactPersonEmail ?? "—"}
              />
              <DefRow label="Business email" value={nomination.email ?? "—"} />
              <DefRow label="Address" value={nomination.address ?? "—"} />
              <DefRow
                label="City / Country"
                value={
                  [nomination.city, nomination.country]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
              <DefRow
                label="Registration number"
                value={nomination.registrationNumber ?? "—"}
              />
              <DefRow
                label="TIN number"
                value={nomination.tinNumber ?? "—"}
              />
              <DefRow
                label="Submitted"
                value={formatDateTime(nomination.submittedAt)}
              />
              <DefRow
                label="Submitting business"
                value={
                  <span title={nomination.businessId}>
                    {nomination.businessId.slice(0, 8)}…
                  </span>
                }
                rawValue
              />
            </DefList>
          </SectionCard>

          <SectionCard title="Merchant's note">
            {nomination.note ? (
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {nomination.note}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No note provided.
              </p>
            )}
          </SectionCard>

          <NominationDecisionClient
            nomination={nomination}
            canManage={canManage}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
