import {
  AlertCircle,
  CalendarClock,
  Lock,
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
import { StatusPill, toPillTone } from "@/components/billing/pill";
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
import { getAuthToken } from "@/lib/auth-utils";
import {
  formatBillingDate,
  formatWhole,
  getSubscriptionStatusMeta,
} from "@/components/billing/shared";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ expired?: string }>;
}) {
  // Set by the protected layout when the active destination's own subscription has lapsed and
  // it redirected here. Tells the owner why they landed on this page rather than the one they
  // asked for — without it the redirect reads as the app losing their click.
  const lockedEntity = (await searchParams)?.expired;
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

  const [business, authToken] = await Promise.all([getCurrentBusiness(), getAuthToken()]);
  const businessId = business?.id ?? subscription.businessId;
  const contactDefaults = {
    email: authToken?.email ?? "",
    phone: authToken?.phoneNumber ?? "",
  };

  const [
    packages,
    addons,
    invoicesPage,
    creditBalances,
    creditPacks,
    creditTransactionsPage,
    locations,
    warehouses,
  ] = await Promise.all([
    getPackages().catch(() => []),
    getAddons().catch(() => []),
    getSubscriptionInvoices(subscription.id).catch(() => null),
    getCreditBalances(businessId).catch(() => []),
    getCreditPacks().catch(() => []),
    getCreditTransactions(businessId, 0, 10).catch(() => null),
    fetchAllLocations().catch(() => null),
    getWarehouses(businessId).catch(() => []),
  ]);

  const invoices = invoicesPage?.content ?? [];
  const totalInvoiceCount = invoicesPage?.totalElements ?? invoices.length;
  const creditTransactions = creditTransactionsPage?.content ?? [];

  const entityLabels: Record<string, string> = {};
  for (const loc of locations ?? []) {
    if (loc.id && loc.name) entityLabels[loc.id] = loc.name;
  }
  for (const wh of warehouses ?? []) {
    if (wh.id && wh.name) entityLabels[wh.id] = wh.name;
  }
  // Every row shown in "Subscribed entities" — bundled units included, since
  // they occupy a row even though their parent pays for them.
  const subscribedItems = (subscription.manageableItems ?? subscription.items).filter(
    (i) => i.status !== "REMOVED" && i.status !== "CANCELLED",
  );
  // Only non-bundled ACTIVE items carry their own price; counting bundled ones
  // would bill the same plan twice.
  const billableItems = subscription.items.filter(
    (i) => i.status === "ACTIVE" && !i.isBundled,
  );
  const pendingInvoices = invoices.filter((i) => i.status === "PENDING");
  const outstandingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const annualCost = billableItems.reduce((sum, item) => {
    const pkg = item.packageInfo;
    if (!pkg) return sum;
    return sum + (pkg.billingInterval === "YEARLY" ? pkg.basePrice : pkg.basePrice * 12);
  }, 0);

  const currency = invoices[0]?.currency ?? subscription.currency ?? "TZS";
  const statusMeta = getSubscriptionStatusMeta(subscription.status);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Billing" }]} />
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription, invoices, and credits."
        titleAccessory={
          <StatusPill tone={toPillTone(statusMeta.variant)}>
            {statusMeta.label}
          </StatusPill>
        }
      />

      <PageBody>
        {lockedEntity && (
          <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-tint px-4 py-3.5">
            <Lock className="mt-0.5 h-4 w-4 flex-none text-warn" />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">
                This {lockedEntity}&apos;s subscription has lapsed
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                It stays locked until it&apos;s paid for. Settle it below to restore
                access — or switch to another destination and come back to this
                whenever you&apos;re ready.
              </p>
            </div>
          </div>
        )}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Wallet className="h-3 w-3" />}
            label="Plan cost"
            value={formatWhole(annualCost)}
            unit={`${currency} / yr`}
            delta={`${billableItems.length} billable item${billableItems.length === 1 ? "" : "s"}`}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<CalendarClock className="h-3 w-3" />}
            label="Paid through"
            value={formatBillingDate(subscription.paidThrough)}
            delta={
              !subscription.autoRenew
                ? "Auto-renew off"
                : subscription.nextBillingDate
                  ? `Auto-renews ${formatBillingDate(subscription.nextBillingDate)}`
                  : "Auto-renews on this date"
            }
            deltaTone={subscription.autoRenew ? "pos" : "neutral"}
          />
          <KpiCard
            icon={<Receipt className="h-3 w-3" />}
            label="Outstanding"
            value={
              outstandingTotal > 0 ? (
                <span className="text-neg">{formatWhole(outstandingTotal)}</span>
              ) : (
                <span className="text-muted-2">—</span>
              )
            }
            unit={outstandingTotal > 0 ? currency : undefined}
            delta={
              pendingInvoices.length > 0
                ? `${pendingInvoices.length} open invoice${pendingInvoices.length === 1 ? "" : "s"} · due now`
                : "All invoices settled"
            }
            deltaTone={pendingInvoices.length > 0 ? "neg" : "pos"}
          />
          <KpiCard
            icon={<Building2 className="h-3 w-3" />}
            label="Subscribed items"
            value={formatWhole(subscribedItems.length)}
            delta={`${totalInvoiceCount} invoice${totalInvoiceCount === 1 ? "" : "s"} on file`}
            deltaTone="neutral"
          />
        </KpiStrip>

        <BillingClient
          subscription={subscription}
          packages={packages}
          addons={addons}
          invoices={invoices}
          totalInvoiceCount={totalInvoiceCount}
          businessId={businessId}
          creditBalances={creditBalances}
          creditPacks={creditPacks}
          creditTransactions={creditTransactions}
          entityLabels={entityLabels}
          contactDefaults={contactDefaults}
        />
      </PageBody>
    </PageShell>
  );
}

