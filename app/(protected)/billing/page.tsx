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
import { getBillingOverview } from "@/lib/actions/billing-overview-actions";
import { logout } from "@/lib/actions/auth-actions";
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

/**
 * The `?expired=<type>&reason=<reason>` banner set by the protected layout when the active
 * destination's own subscription is locked and it redirected here. Tells the owner why they
 * landed on this page rather than the one they asked for — without it the redirect reads as
 * the app losing their click. `lockReason` further distinguishes "this entity's subscription
 * actually lapsed" from every other case (see (protected)/layout.tsx) — telling a paid-up
 * customer their subscription lapsed when we merely couldn't confirm it (billing outage, or
 * some future third `reason` this branch has never seen) is the wrong message. The branching
 * below is deliberately positive on "lapsed" — only that exact value gets the accusatory
 * copy — rather than positive on today's other known value ("no-entitlement-data"), so an
 * unrecognized future reason falls into the neutral copy instead of silently reading as
 * "you didn't pay". Reused across all three `getBillingOverview()` outcomes (see the three
 * branches below), since a redirect can land on any of them. `business-mismatch` never
 * reaches this banner — it gets its own full-page branch before the overview is even
 * fetched, because the overview would be about the wrong business (see below).
 */
function LockBanner({
  lockedEntity,
  lockReason,
}: {
  lockedEntity: string;
  lockReason?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-tint px-4 py-3.5">
      <Lock className="mt-0.5 h-4 w-4 flex-none text-warn" />
      {lockReason === "lapsed" ? (
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
      ) : (
        <div>
          <p className="text-[13.5px] font-semibold text-ink">
            Access to this {lockedEntity} is restricted
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
            Please try again shortly, or contact support if this continues —
            or switch to another destination and come back to this whenever
            you&apos;re ready.
          </p>
        </div>
      )}
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ expired?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const lockedEntity = params?.expired;
  const lockReason = params?.reason;

  // business-mismatch gets its own screen INSTEAD of the billing dashboard, and the
  // overview is deliberately not fetched: `getBillingOverview()` resolves the business
  // from the JWT claim — the very thing the gate just said disagrees with the business
  // in scope — so rendering it here would show another business's invoices and plan
  // under this one's sidebar. The fix for the skew is re-selecting the business (the
  // switch flow re-derives the JWT claim from the destination being switched to), so
  // that is the primary CTA; sign-out is the manual fallback, never automatic — if the
  // claim-stamping bug ever regresses, a forced logout would re-stamp the same wrong
  // business on re-login and lock a paying customer out in a loop.
  if (lockReason === "business-mismatch") {
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
              <p className="text-sm font-medium text-ink">
                This business doesn&apos;t match your sign-in session
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                The business you selected isn&apos;t the one your session is signed in
                for, so billing here would show the wrong business&apos;s details.
                Re-select your business to fix this — if it keeps happening, sign out
                and back in.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link href="/select-business">Switch business</Link>
              </Button>
              <form action={logout}>
                <Button type="submit" size="sm" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </PageBody>
      </PageShell>
    );
  }

  const result = await getBillingOverview();

  if (result.status === "no-subscription") {
    return (
      <PageShell>
        <PageBreadcrumbs items={[{ title: "Billing" }]} />
        <PageHeader title="Billing" subtitle="Manage your subscription, invoices, and credits." />
        <PageBody>
          {lockedEntity && (
            <LockBanner lockedEntity={lockedEntity} lockReason={lockReason} />
          )}
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
            {/*
             * No known in-app route serves "pick a plan for an already-registered,
             * already-authenticated business" — /select-subscription doesn't exist
             * anywhere under app/, and the only other plan picker, (auth)/subscription,
             * terminates in business-registration's createBusinessWithLocations, which
             * creates a NEW business rather than a subscription for this one. Left
             * pointing at /select-subscription deliberately rather than wiring a worse
             * destination; see task-7-report.md.
             */}
            <Button asChild size="sm">
              <Link href="/select-subscription">Choose a plan</Link>
            </Button>
          </div>
        </PageBody>
      </PageShell>
    );
  }

  if (result.status === "unreachable") {
    // Distinct from "no-subscription" above on purpose: this business may be fully paid up —
    // we simply couldn't get a trustworthy answer from billing. Must never say "no
    // subscription" or offer the plan-picker CTA, or a paying customer during an outage reads
    // it as an accusation of non-payment (see C1 in the Task 7 review).
    return (
      <PageShell>
        <PageBreadcrumbs items={[{ title: "Billing" }]} />
        <PageHeader title="Billing" subtitle="Manage your subscription, invoices, and credits." />
        <PageBody>
          {lockedEntity && (
            <LockBanner lockedEntity={lockedEntity} lockReason={lockReason} />
          )}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-card py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-canvas">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                We couldn&apos;t reach the billing service
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                This isn&apos;t about whether you&apos;ve paid — we just couldn&apos;t
                confirm your subscription right now. Please try again shortly, or use
                the sidebar to switch to another destination in the meantime.
              </p>
            </div>
          </div>
        </PageBody>
      </PageShell>
    );
  }

  const overview = result.data;
  const subscription = overview.subscription;

  const [business, authToken] = await Promise.all([getCurrentBusiness(), getAuthToken()]);
  const businessId = business?.id ?? subscription.businessId;
  const contactDefaults = {
    email: authToken?.email ?? "",
    phone: authToken?.phoneNumber ?? "",
  };

  // fetchAllLocations/getWarehouses hit the accounts service, not billing, so they
  // stay outside the overview call.
  const [locations, warehouses] = await Promise.all([
    fetchAllLocations().catch(() => null),
    getWarehouses(businessId).catch(() => []),
  ]);

  const packages = overview.packages;
  const addons = overview.addons;
  const creditBalances = overview.creditBalances;
  const creditPacks = overview.creditPacks;
  const entitlements = overview.entitlements;

  // Internal account: never invoiced, never expires. Its paidThrough deliberately keeps the
  // true (often past) value, so the money surfaces below must not be read as a live runway.
  const isBillingExempt = entitlements?.billingExempt === true;

  // The overview endpoint returns flat arrays + totals rather than Spring Page objects.
  // Rebuild the {content, totalElements} shape the rest of this page reads — the billing
  // components downstream (BillingClient, InvoicesTab, CreditsTab) only ever touch
  // `content` and `totalElements`; none of them read totalPages/number/size.
  // `?? []`/`?? 0` guard against a payload that's missing a field despite the type saying
  // it's required — without it a bare `undefined` here would throw downstream on the first
  // `.filter(...)`/`.reduce(...)` call and 500 the page instead of degrading.
  const invoicesPage = {
    content: overview.invoices ?? [],
    totalElements: overview.invoicesTotal ?? 0,
  };
  const creditTransactionsPage = {
    content: overview.creditTransactions ?? [],
    totalElements: overview.creditTransactionsTotal ?? 0,
  };

  const invoices = invoicesPage.content;
  const totalInvoiceCount = invoicesPage.totalElements;
  const creditTransactions = creditTransactionsPage.content;

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
          isBillingExempt ? (
            <StatusPill tone="neutral">Internal — billing bypassed</StatusPill>
          ) : (
            <StatusPill tone={toPillTone(statusMeta.variant)}>
              {statusMeta.label}
            </StatusPill>
          )
        }
      />

      <PageBody>
        {lockedEntity && (
          <LockBanner lockedEntity={lockedEntity} lockReason={lockReason} />
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
            label={isBillingExempt ? "Billing" : "Paid through"}
            value={
              isBillingExempt ? (
                <span className="text-muted-2">Not billed</span>
              ) : (
                formatBillingDate(subscription.paidThrough)
              )
            }
            delta={
              isBillingExempt
                ? "Internal account — never charged"
                : !subscription.autoRenew
                  ? "Auto-renew off"
                  : subscription.nextBillingDate
                    ? `Auto-renews ${formatBillingDate(subscription.nextBillingDate)}`
                    : "Auto-renews on this date"
            }
            deltaTone={!isBillingExempt && subscription.autoRenew ? "pos" : "neutral"}
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
          isBillingExempt={isBillingExempt}
        />
      </PageBody>
    </PageShell>
  );
}

