import { notFound, redirect } from "next/navigation";

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
import { getLoanProduct } from "@/lib/actions/admin/loans";
import type { LoanProductResponse } from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loan product" };

interface EditLoanProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLoanProductPage({
  params,
}: EditLoanProductPageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  const canManage = hasInternalPermission(token, PERM.LOANS_PRODUCT_MANAGE);
  const canRead = canManage || hasInternalPermission(token, PERM.LOANS_READ);

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loan product"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let product: LoanProductResponse | null = null;
  try {
    product = await getLoanProduct(id);
  } catch {
    product = null;
  }
  if (!product) notFound();

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Loan products", href: "/loans/products" },
            { title: product.name },
          ]}
        />
        <PageHeader
          title={product.name}
          subtitle={`${product.code} · ${product.currency}${
            canManage ? "" : " · read-only"
          }`}
        />
        <PageBody>
          <LoanProductForm item={product} canManage={canManage} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
