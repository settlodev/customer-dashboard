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
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listLoanProducts } from "@/lib/actions/admin/loans";
import {
  LOAN_PRODUCT_TYPE_LABELS,
  PRICING_TYPE_LABELS,
  REPAYMENT_FREQUENCY_LABELS,
  fmtAmount,
  type LoanProductResponse,
} from "@/types/admin/loans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loan products" };

export default async function AdminLoanProductsPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  const canRead = hasInternalPermission(
    token,
    PERM.LOANS_READ,
    PERM.LOANS_PRODUCT_MANAGE,
  );
  const canManage = hasInternalPermission(token, PERM.LOANS_PRODUCT_MANAGE);

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Loan products"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let products: LoanProductResponse[] = [];
  let loadError: string | null = null;
  try {
    const page = await listLoanProducts();
    products = page.content ?? [];
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load loan products.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Loan products"
          subtitle="Financing products the Loan Management Service offers to merchants."
          actions={
            canManage ? (
              <Button asChild>
                <Link href="/loans/products/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> New product
                </Link>
              </Button>
            ) : undefined
          }
        />
        <PageBody>
          {loadError ? (
            <div className="rounded-xl border border-neg/30 bg-neg/5 px-4 py-3 text-sm text-neg">
              {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-2 bg-card py-16 text-center text-sm text-muted-foreground">
              No loan products yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Pricing</th>
                      <th className="px-4 py-3 text-right">Principal</th>
                      <th className="px-4 py-3 text-right">Term (days)</th>
                      <th className="px-4 py-3">Repayment</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-canvas/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/loans/products/${p.id}`}
                            className="font-medium text-ink hover:text-primary hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {p.code} · {p.currency}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {LOAN_PRODUCT_TYPE_LABELS[p.productType] ??
                            p.productType}
                        </td>
                        <td className="px-4 py-3">
                          {PRICING_TYPE_LABELS[p.pricingType] ?? p.pricingType}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {fmtAmount(p.minPrincipal)} – {fmtAmount(p.maxPrincipal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {p.minTermDays} – {p.maxTermDays}
                        </td>
                        <td className="px-4 py-3">
                          {REPAYMENT_FREQUENCY_LABELS[p.repaymentFrequency] ??
                            p.repaymentFrequency}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.active
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
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
