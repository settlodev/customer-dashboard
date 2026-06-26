import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillingView } from "@/components/admin/billing/billing-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAdminBusinessDetail } from "@/lib/actions/admin/businesses";
import {
  getBusinessSubscription,
  listAvailableDiscounts,
  listBusinessActiveDiscounts,
  listBusinessInvoices,
} from "@/lib/actions/admin/billing";
import type {
  DiscountResponse,
  InvoicePage,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
} from "@/types/admin/billing";
import type { AdminBusinessDetail } from "@/types/admin/business";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Business billing",
};

const BILLING_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPPORT_AGENT"];

interface BusinessBillingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function AdminBusinessBillingPage({
  params,
  searchParams,
}: BusinessBillingPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canBilling = role ? BILLING_ROLES.includes(role) : false;
  const canGrantFree = role === "SYSTEM_ADMIN";

  if (!canBilling) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Billing"
            subtitle="Restricted to System Admins and Support Agents."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { id } = await params;
  const { page: pageParam, limit: limitParam } = await searchParams;
  // The shared DataTable owns pagination via a 1-based `?page` + `?limit`;
  // convert to the backend's 0-based index.
  const pageOneIndexed = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(limitParam ?? "20", 10) || 20);

  // Load the business first so the header carries context. A missing
  // business 404s — there's no reason to render the billing view
  // against an ID we couldn't resolve.
  let business: AdminBusinessDetail;
  try {
    business = await getAdminBusinessDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Business billing" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load business."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  // Per-page billing data — same fan-out the standalone page used,
  // just scoped to this business. Errors from any individual call
  // surface in the corresponding panel.
  const results = await Promise.allSettled([
    getBusinessSubscription(id),
    listBusinessInvoices(id, backendPage, size),
    listBusinessActiveDiscounts(id),
    listAvailableDiscounts(),
  ]);
  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;
  const errorMessage = (r: PromiseSettledResult<unknown>): string | null =>
    r.status === "rejected"
      ? r.reason instanceof Error
        ? r.reason.message
        : String(r.reason)
      : null;

  const subscription = value(results[0]) as SubscriptionResponse | null;
  const invoices = value(results[1]) as InvoicePage | null;
  const activeDiscounts = (value(results[2]) ?? []) as SubscriptionDiscountResponse[];
  const availableDiscounts = (value(results[3]) ?? []) as DiscountResponse[];
  const subscriptionError = errorMessage(results[0]);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Businesses", href: "/businesses" },
            { title: business.name, href: `/businesses/${business.id}` },
            { title: "Billing" },
          ]}
        />

        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              {business.name}
              <Badge
                variant="outline"
                className="border-muted bg-muted text-muted-foreground font-mono text-[10.5px]"
              >
                Billing
              </Badge>
            </span>
          }
          subtitle={
            <span className="font-mono text-[12px]">
              {business.identifier ?? business.slug} · {business.baseCurrency}
            </span>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/businesses/${business.id}`}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Business detail
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/businesses">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  All businesses
                </Link>
              </Button>
            </div>
          }
        />

        <PageBody>
          {subscriptionError && !subscription ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {subscriptionError}
            </p>
          ) : (
            <BillingView
              businessId={business.id}
              subscription={subscription}
              invoicePage={invoices}
              activeDiscounts={activeDiscounts}
              availableDiscounts={availableDiscounts}
              canGrantFree={canGrantFree}
              errors={{
                subscription: subscriptionError,
                invoices: errorMessage(results[1]),
                activeDiscounts: errorMessage(results[2]),
                availableDiscounts: errorMessage(results[3]),
              }}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}
