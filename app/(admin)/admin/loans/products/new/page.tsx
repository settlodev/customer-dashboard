import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import LoanProductForm from "@/components/forms/loan-product-form";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "New loan product" };

export default async function NewLoanProductPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.LOANS_PRODUCT_MANAGE)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="New loan product"
            subtitle="You don't have permission to manage loan products."
          />
        </PageShell>
      </AdminShell>
    );
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Loan products", href: "/loans/products" },
            { title: "New" },
          ]}
        />
        <PageHeader
          title="New loan product"
          subtitle="Define a financing product the Loan Management Service can offer to merchants."
        />
        <PageBody>
          <LoanProductForm item={null} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
