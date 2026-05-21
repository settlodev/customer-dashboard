import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { BillingLookupForm } from "@/components/admin/billing/billing-lookup-form";
import { BillingView } from "@/components/admin/billing/billing-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
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
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Billing",
};

const BILLING_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPPORT_AGENT"];

interface BillingPageProps {
  searchParams: Promise<{
    businessId?: string;
    page?: string;
  }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminBillingPage({
  searchParams,
}: BillingPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? BILLING_ROLES.includes(role) : false;
  const canGrantFree = role === "SYSTEM_ADMIN";

  if (!canRead) {
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

  const params = await searchParams;
  const businessId = params.businessId?.trim();
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);

  if (!businessId) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Billing"
            subtitle="Look up a business by ID to view its subscription and invoices."
          />
          <PageBody>
            <BillingLookupForm />
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  if (!UUID_REGEX.test(businessId)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Billing"
            subtitle="Invalid business ID format."
          />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {businessId} is not a valid UUID. Check the value and try again.
            </p>
            <BillingLookupForm initialValue={businessId} />
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const results = await Promise.allSettled([
    getBusinessSubscription(businessId),
    listBusinessInvoices(businessId, page, 20),
    listBusinessActiveDiscounts(businessId),
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
  const activeDiscounts = (value(results[2]) ??
    []) as SubscriptionDiscountResponse[];
  const availableDiscounts = (value(results[3]) ??
    []) as DiscountResponse[];

  const subscriptionError = errorMessage(results[0]);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Billing"
          subtitle={
            <span className="font-mono text-[12px]">
              business · {businessId}
            </span>
          }
          actions={<BillingLookupForm initialValue={businessId} inline />}
        />
        <PageBody>
          {subscriptionError && !subscription ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {subscriptionError}
            </p>
          ) : (
            <BillingView
              businessId={businessId}
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
