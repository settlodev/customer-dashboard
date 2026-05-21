import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AccountDetailActions } from "@/components/admin/account-detail-actions";
import { AccountStaffCard } from "@/components/admin/account-staff-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAccountDetail } from "@/lib/actions/admin/accounts";
import { AdminAccountDetail } from "@/types/admin/account";
import { InternalRole } from "@/types/types";

export const metadata = {
  title: "Account detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function InfoItem({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono
            ? "break-all font-mono text-[13px] text-ink"
            : "break-words text-[13px] text-ink"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

export default async function AdminAccountDetailPage({
  params,
}: DetailPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? READ_ROLES.includes(role) : false;
  const canSuspend = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  const canDelete = role === "SYSTEM_ADMIN";
  const canAssignStaff = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Account detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { id } = await params;

  let account: AdminAccountDetail;
  try {
    account = await getAccountDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Account detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load account."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Accounts", href: "/accounts" },
            { title: account.fullName || account.email },
          ]}
        />
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              {account.fullName || account.email}
              <Badge
                variant="outline"
                className={
                  account.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                }
              >
                {account.active ? "Active" : "Inactive"}
              </Badge>
            </span>
          }
          subtitle={
            <span className="font-mono">
              {account.email}
              {account.accountNumber ? ` · ${account.accountNumber}` : ""}
            </span>
          }
          actions={
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/accounts">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/businesses?accountId=${account.id}`}>
                  <Briefcase className="mr-1.5 h-4 w-4" />
                  View businesses
                </Link>
              </Button>
              <AccountDetailActions
                account={account}
                canSuspend={canSuspend}
                canDelete={canDelete}
              />
            </>
          }
        />

        <PageBody>
          <div className="grid gap-4 md:grid-cols-2">
            <AccountStaffCard
              accountId={account.id}
              kind="sales"
              title="Sales person"
              staff={account.salesPerson}
              canEdit={canAssignStaff}
            />
            <AccountStaffCard
              accountId={account.id}
              kind="support"
              title="Support staff"
              staff={account.supportStaff}
              canEdit={canAssignStaff}
            />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
            <div className="bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Businesses
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {account.businessCount}
              </p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Staff seats
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {account.staffCount}
              </p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Business setup
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {account.isBusinessRegistrationComplete ? "Done" : "Pending"}
              </p>
            </div>
            <div className="bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Location setup
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {account.isLocationRegistrationComplete ? "Done" : "Pending"}
              </p>
            </div>
          </div>

          {/* Profile + Geography */}
          <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-ink">Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="First name" value={account.firstName} mono={false} />
                <InfoItem label="Last name" value={account.lastName} mono={false} />
                <InfoItem label="Phone" value={account.phoneNumber} />
                <InfoItem
                  label="Identifier"
                  value={account.identifier ?? "—"}
                />
                <InfoItem label="Slug" value={account.slug} />
                <InfoItem
                  label="Whitelabel"
                  value={
                    account.whitelabelAppCode
                      ? `${account.whitelabelAppCode}`
                      : "—"
                  }
                />
              </div>
              {account.bio && (
                <InfoItem label="Bio" value={account.bio} mono={false} />
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-ink">Geography</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Country"
                  value={
                    account.countryName ??
                    account.countryCode ??
                    "—"
                  }
                  mono={false}
                />
                <InfoItem label="Region" value={account.region} mono={false} />
                <InfoItem label="District" value={account.district} mono={false} />
                <InfoItem label="Ward" value={account.ward} mono={false} />
                <InfoItem label="Area code" value={account.areaCode} />
              </div>

              <h2 className="pt-2 text-sm font-semibold text-ink">Timestamps</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Created" value={formatDate(account.createdAt)} />
                <InfoItem label="Updated" value={formatDate(account.updatedAt)} />
              </div>
            </div>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
