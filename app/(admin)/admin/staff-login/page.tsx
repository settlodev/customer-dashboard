import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { StaffLoginView } from "@/components/admin/master-key/staff-login-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in as Staff",
};

export default async function StaffLoginPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  // UX gate only — Auth re-checks the same permission on every endpoint behind
  // this page, and additionally requires the master key, so a hand-crafted
  // request gets nowhere regardless of what renders here.
  const canImpersonateStaff = hasInternalPermission(
    token,
    PERM.USERS_IMPERSONATE_STAFF,
  );
  if (!canImpersonateStaff) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Log in as Staff"
            subtitle="You do not have permission to log in as staff members."
          />
        </PageShell>
      </AdminShell>
    );
  }

  // Nothing is fetched during render on purpose: reading the master key writes a
  // MASTER_KEY_VIEWED audit row, so doing it here would stamp the trail on every
  // navigation. The view reads it only when the operator asks.
  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Log in as Staff"
          subtitle="Open a merchant's dashboard as one of their staff members, to reproduce what they're seeing. Requires the rotating master key in addition to your own sign-in, and every session is audited against your account."
        />
        <PageBody>
          <StaffLoginView />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
