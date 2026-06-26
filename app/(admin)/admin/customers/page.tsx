import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { CustomerSearchView } from "@/components/admin/customer-search-view";
import { MergedCustomersView } from "@/components/admin/merged-customers-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { searchCustomers } from "@/lib/actions/admin/accounts";
import { listMergedCustomers } from "@/lib/actions/admin/merged-customers";
import { cn } from "@/lib/utils";
import type {
  AdminCustomerSearchPage,
  MergedCustomerPage,
} from "@/types/admin/account";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Customers",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface CustomersPageProps {
  searchParams: Promise<{
    view?: string;
    q?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
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
            title="Customers"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canEdit = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  const params = await searchParams;
  const view = params.view === "records" ? "records" : "merged";
  // The shared DataTable owns pagination via a 1-based `?page` + `?limit`;
  // convert to the backend's 0-based index.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);

  // "All customers" (merged) tab — the default global, de-duplicated list.
  let mergedPage: MergedCustomerPage | null = null;
  let mergedError: string | null = null;
  const mergedSearch = params.search?.trim() ?? "";

  // "Find a record" tab — individual per-location records (editable).
  let recordsPage: AdminCustomerSearchPage | null = null;
  let recordsError: string | null = null;
  const q = params.q?.trim() ?? "";

  if (view === "merged") {
    try {
      mergedPage = await listMergedCustomers({
        search: mergedSearch,
        page: backendPage,
        size,
      });
    } catch (error: any) {
      mergedError = error?.message ?? "Failed to load customers.";
    }
  } else if (q.length > 0) {
    try {
      recordsPage = await searchCustomers({ q, page: backendPage, size });
    } catch (error: any) {
      recordsError = error?.message ?? "Failed to search customers.";
    }
  }

  const tab = (label: string, href: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-ink",
      )}
    >
      {label}
    </Link>
  );

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Customers"
          subtitle="Every customer across all businesses — merged by phone & email."
        />
        <PageBody>
          <div className="flex items-center gap-1 border-b border-line pb-2">
            {tab("All customers", "/customers", view === "merged")}
            {tab("Find a record", "/customers?view=records", view === "records")}
          </div>

          {view === "merged" ? (
            <MergedCustomersView
              initialSearch={mergedSearch}
              initialPage={mergedPage}
              error={mergedError}
            />
          ) : (
            <CustomerSearchView
              initialQuery={q}
              initialPage={recordsPage}
              error={recordsError}
              canEdit={canEdit}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
