import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { CustomerSearchView } from "@/components/admin/customer-search-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { searchCustomers } from "@/lib/actions/admin/accounts";
import type { AdminCustomerSearchPage } from "@/types/admin/account";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Customer search",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface CustomerSearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function AdminCustomerSearchPage({
  searchParams,
}: CustomerSearchPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? READ_ROLES.includes(role) : false;
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Customer search"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);

  let pageData: AdminCustomerSearchPage | null = null;
  let loadError: string | null = null;

  if (q.length > 0) {
    try {
      pageData = await searchCustomers({ q, page, size: 20 });
    } catch (error: any) {
      loadError = error?.message ?? "Failed to search customers.";
    }
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Customer search"
          subtitle="Find a customer across all accounts and whitelabels."
        />
        <PageBody>
          <CustomerSearchView
            initialQuery={q}
            initialPage={pageData}
            error={loadError}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
