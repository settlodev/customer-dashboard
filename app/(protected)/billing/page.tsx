import {
  AlertCircle,
  CalendarClock,
  Receipt,
  Wallet,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { BillingClient } from "@/components/billing/billing-client";
import { Badge } from "@/components/ui/badge";
import {
  getAddons,
  getCreditBalances,
  getCreditPacks,
  getCreditTransactions,
  getCurrentSubscription,
  getPackages,
  getSubscriptionInvoices,
} from "@/lib/actions/billing-actions";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { getWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { formatBillingDate, getSubscriptionStatusMeta } from "@/components/billing/shared";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return (
      <PageShell>
        <PageBreadcrumbs items={[{ title: "Billing" }]} />
        <PageHeader title="Billing" subtitle="Manage your subscription, invoices, and credits." />
        <PageBody>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-card py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">No subscription found</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Your business doesn&apos;t have an active subscription on the billing service yet.
                Pick a plan to get started.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/select-subscription">Choose a plan</Link>
            </Button>
          </div>
        </PageBody>
      </PageShell>
    );
  }

  const business = await getCurrentBusiness();
  const businessId = business?.id ?? subscription.businessId;

  const [
    packages,
    addons,
    invoices,
    creditBalances,
    creditPacks,
    creditTransactionsPage,
    locations,
    warehouses,
  ] = await Promise.all([
    getPackages().catch(() => []),
    getAddons().catch(() => []),
    getSubscriptionInvoices(subscription.id).catch(() => []),
    getCreditBalances(businessId).catch(() => []),
    getCreditPacks().catch(() => []),
    getCreditTransactions(businessId, 0, 10).catch(() => null),
    fetchAllLocations().catch(() => null),
    getWarehouses(businessId).catch(() => []),
  ]);

  const creditTransactions = creditTransactionsPage?.content ?? [];

  const entityLabels: Record<string, string> = {};
  for (const loc of locations ?? []) {
    if (loc.id && loc.name) entityLabels[loc.id] = loc.name;
  }
  for (const wh of warehouses ?? []) {
    if (wh.id && wh.name) entityLabels[wh.id] = wh.name;
  }
  const activeItems = subscription.items.filter((i) => i.status === "ACTIVE");
  const pendingInvoices = invoices.filter((i) => i.status === "PENDING");
  const outstandingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const monthlyCost = activeItems.reduce((sum, item) => {
    const pkg = item.packageInfo;
    if (!pkg) return sum;
    return sum + (pkg.billingInterval === "YEARLY" ? pkg.basePrice / 12 : pkg.basePrice);
  }, 0);

  const currency = invoices[0]?.currency ?? subscription.currency ?? "TZS";
  const statusMeta = getSubscriptionStatusMeta(subscription.status);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Billing" }]} />
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription, invoices, and credits."
        titleAccessory={<Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
      />

      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Wallet className="h-3 w-3" />}
            label="Monthly cost"
            value={Math.round(monthlyCost).toLocaleString()}
            unit={currency}
            delta={`${activeItems.length} item${activeItems.length === 1 ? "" : "s"}`}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<CalendarClock className="h-3 w-3" />}
            label="Paid through"
            value={formatBillingDate(subscription.paidThrough)}
            delta={
              subscription.autoRenew
                ? `Auto-renews ${formatBillingDate(subscription.nextBillingDate)}`
                : "Auto-renew off"
            }
            deltaTone={subscription.autoRenew ? "pos" : "neutral"}
          />
          <KpiCard
            icon={<Receipt className="h-3 w-3" />}
            label="Outstanding"
            value={outstandingTotal > 0 ? outstandingTotal.toLocaleString() : "—"}
            unit={outstandingTotal > 0 ? currency : undefined}
            delta={
              pendingInvoices.length > 0
                ? `${pendingInvoices.length} pending invoice${pendingInvoices.length === 1 ? "" : "s"}`
                : "All invoices settled"
            }
            deltaTone={pendingInvoices.length > 0 ? "neg" : "pos"}
          />
          <KpiCard
            icon={<Building2 className="h-3 w-3" />}
            label="Items"
            value={activeItems.length.toLocaleString()}
            delta={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} on file`}
            deltaTone="neutral"
          />
        </KpiStrip>

        <BillingClient
          subscription={subscription}
          packages={packages}
          addons={addons}
          invoices={invoices}
          businessId={businessId}
          creditBalances={creditBalances}
          creditPacks={creditPacks}
          creditTransactions={creditTransactions}
          entityLabels={entityLabels}
        />
      </PageBody>
    </PageShell>
  );
}

