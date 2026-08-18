import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  MonitorCheck,
  Store,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiStrip } from "@/components/layouts/kpi-strip";
import { AccountStaffCard } from "@/components/admin/account-staff-card";
import { AccountDetailActions } from "@/components/admin/account-detail-actions";
import { LifecycleCard } from "@/components/admin/account-detail/lifecycle-card";
import { BusinessesLocationsCard } from "@/components/admin/account-detail/businesses-locations-card";
import { AccountNotesCard } from "@/components/admin/account-detail/account-notes-card";
import { LogInAsButton } from "@/components/admin/account-detail/log-in-as-button";
import { AccountEmailButton } from "@/components/admin/account-detail/send-email-dialog";
import { SectionCard } from "@/components/admin/shared/section-card";
import { Monogram } from "@/components/admin/shared/monogram";
import { DefList, DefRow, DefIcon } from "@/components/admin/shared/def-list";
import { Timeline } from "@/components/admin/shared/timeline";
import { OnboardingBadge } from "@/components/admin/shared/onboarding-badge";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { AdminAccountDetail } from "@/types/admin/account";
import {
  AccountBillingRollup,
  AccountInsights,
} from "@/types/admin/account-insights";
import type { AccountStructure } from "@/types/admin/account-structure";

interface AccountDetailViewProps {
  account: AdminAccountDetail;
  insights: AccountInsights;
  structure: AccountStructure;
  canSuspend: boolean;
  canDelete: boolean;
  canAssignStaff: boolean;
  canResend: boolean;
  canManage: boolean;
}

function accountAge(createdAt: string): { value: string; note: string } {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return { value: "—", note: "" };
  const diff = Math.max(0, Date.now() - then);
  const mins = diff / 60_000;
  const hours = diff / 3_600_000;
  const days = diff / 86_400_000;
  if (hours < 1) return { value: `${Math.max(1, Math.floor(mins))}m`, note: "today" };
  if (hours < 24) return { value: `${Math.floor(hours)}h`, note: "today" };
  if (days < 7) return { value: `${Math.floor(days)}d`, note: "this week" };
  if (days < 30) return { value: `${Math.floor(days)}d`, note: "this month" };
  if (days < 365) return { value: `${Math.floor(days / 30)}mo`, note: "" };
  return { value: `${Math.floor(days / 365)}y`, note: "" };
}

export function AccountDetailView({
  account,
  insights,
  structure,
  canSuspend,
  canDelete,
  canAssignStaff,
  canResend,
  canManage,
}: AccountDetailViewProps) {
  const stub = !insights.isLive;
  const name = account.fullName || account.email;
  const whitelabel = account.whitelabelAppCode ?? "SETTLO";
  const age = accountAge(account.createdAt);
  const { kpis } = insights;
  const deleted = !!account.deletedAt;

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <Monogram name={name} seed={account.id} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[25px] font-bold tracking-[-0.03em] text-ink">
                {name}
              </h1>
              <StatusBadge active={account.active} deleted={deleted} />
              {account.internal && <InternalBadge />}
              <OnboardingBadge state={account.onboardingState} />
            </div>
            <p className="mt-1.5 font-mono text-[12.5px] text-muted-foreground">
              {account.email}
              {account.accountNumber && (
                <span className="text-ink-3"> · {account.accountNumber}</span>
              )}
              <span> · {whitelabel}</span>
              {account.createdAt && <span> · joined {timeSince(account.createdAt)}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/accounts">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <LogInAsButton accountId={account.id} />
          {canManage && (
            <AccountEmailButton
              accountId={account.id}
              recipientEmail={account.email}
            />
          )}
          <Button asChild variant="accent" size="sm">
            <Link href={`/businesses?accountId=${account.id}`}>
              <Store className="h-4 w-4" />
              View businesses
            </Link>
          </Button>
          <AccountDetailActions
            account={account}
            canSuspend={canSuspend}
            canDelete={canDelete}
            canResend={canResend}
            canManage={canManage}
          />
        </div>
      </div>

      {/* ── Deleted banner ─────────────────────────────────────── */}
      {deleted && (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-destructive/25 bg-destructive/[0.06] px-4 py-3">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[9px] bg-destructive/10 text-destructive">
            <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.6} />
          </span>
          <p className="flex-1 text-[13px] text-ink-2">
            <b className="font-semibold text-ink">
              This account was deleted
              {account.deletedAt ? ` ${timeSince(account.deletedAt)}` : ""}.
            </b>{" "}
            It&apos;s hidden from the main accounts list and its owner can no
            longer sign in. Soft-deleted accounts are anonymised after 30 days
            but their records remain. If it has no orders, stock or paid
            invoices, use{" "}
            <b className="font-semibold text-ink">Purge permanently</b> to
            remove it for good.
          </p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* ── Attention banner ───────────────────────────────── */}
          {insights.attentionBanner && (
            <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[hsl(var(--warn)_/_0.25)] bg-[hsl(var(--warn)_/_0.06)] px-4 py-3">
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[9px] bg-warn-tint text-warn">
                <AlertTriangle className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </span>
              <p className="flex-1 text-[13px] text-ink-2">
                <b className="font-semibold text-ink">
                  {insights.attentionBanner.title}
                </b>{" "}
                {insights.attentionBanner.text}
              </p>
              {insights.attentionBanner.actionLabel && (
                <Link
                  href={insights.attentionBanner.actionHref ?? "#"}
                  className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold text-[#C25E26] hover:text-[#a04d1d]"
                >
                  {insights.attentionBanner.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* ── KPI strip ──────────────────────────────────────── */}
          <KpiStrip cols={6}>
            <KCell label="Businesses" value={String(account.businessCount)} />
            <KCell
              label="Billable units"
              value={String(insights.billing.billableUnits)}
              sub={`${insights.billing.activeSubscriptions} active`}
            />
            <KCell
              label="MRR"
              cur={insights.billing.mrr.currency}
              value={insights.billing.mrr.value}
              small
            />
            <KCell
              label="GMV processed"
              cur={kpis.gmv.currency}
              value={kpis.gmv.value}
              sub={kpis.gmv.note}
              small
            />
            <KCell label="Open trials" value={String(insights.billing.openTrials)} small />
            <KCell label="Account age" value={age.value} sub={age.note} small />
          </KpiStrip>

          {/* ── Ownership row ──────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <AccountStaffCard
              accountId={account.id}
              kind="sales"
              title="Sales person"
              staff={account.salesPerson}
              canEdit={canAssignStaff}
            />
            <AccountStaffCard
              accountId={account.id}
              kind="support"
              title="Support staff"
              staff={account.supportStaff}
              canEdit={canAssignStaff}
            />
            <LifecycleCard lifecycle={insights.lifecycle} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Engagement & health" stub={stub}>
              <DefList>
                <DefRow
                  label="Onboarding"
                  icon={
                    <DefIcon tone="pos">
                      <MonitorCheck className="h-3.5 w-3.5" />
                    </DefIcon>
                  }
                  value={insights.engagement.onboarding.value}
                  tone={insights.engagement.onboarding.tone}
                />
                <DefRow
                  label="Last active"
                  icon={
                    <DefIcon tone="blue">
                      <Clock className="h-3.5 w-3.5" />
                    </DefIcon>
                  }
                  value={insights.engagement.lastActive}
                />
                <DefRow
                  label="First sale"
                  icon={
                    <DefIcon tone="warn">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </DefIcon>
                  }
                  value={insights.engagement.firstSale.value}
                  tone={insights.engagement.firstSale.tone}
                />
                <DefRow
                  label="Active terminals"
                  icon={
                    <DefIcon tone="neutral">
                      <MonitorCheck className="h-3.5 w-3.5" />
                    </DefIcon>
                  }
                  value={insights.engagement.terminals}
                />
                <DefRow
                  label="Staff users"
                  icon={
                    <DefIcon tone="neutral">
                      <User className="h-3.5 w-3.5" />
                    </DefIcon>
                  }
                  value={insights.engagement.staffUsers}
                />
                <DefRow
                  label="Health score"
                  value={
                    <>
                      {insights.engagement.healthScore.value}{" "}
                      <span className="font-normal text-muted-2">
                        / {insights.engagement.healthScore.max} ·{" "}
                        {insights.engagement.healthScore.note}
                      </span>
                    </>
                  }
                />
              </DefList>
            </SectionCard>

            <SectionCard title="Support & success" stub={stub}>
              <DefList>
                <DefRow label="Open tickets" value={insights.support.openTickets} />
                <DefRow
                  label="Last contact"
                  value={insights.support.lastContact.value}
                  tone={insights.support.lastContact.tone}
                />
                <DefRow
                  label="CSAT"
                  value={insights.support.csat.value}
                  tone={insights.support.csat.tone}
                />
                <DefRow
                  label="Welcome call"
                  value={insights.support.welcomeCall.value}
                  tone={insights.support.welcomeCall.tone}
                />
              </DefList>
              <AccountNotesCard
                accountId={account.id}
                notes={insights.support.notes}
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <BusinessesLocationsCard
            businesses={insights.businesses}
            structure={structure}
            stub={stub}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingRollupCard billing={insights.billing} stub={stub} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <SectionCard
            title="Activity"
            subtitle="Onboarding & account events"
            linkLabel="Full log"
            stub={stub}
          >
            <Timeline
              items={insights.timeline.map((t) => ({
                text: t.text,
                time: t.time,
                dotColor: t.dotColor,
              }))}
            />
          </SectionCard>

          <SectionCard title="Profile & geography">
            <p className="mb-3.5 text-[13px] font-semibold text-ink">Profile</p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="First name" value={account.firstName} />
              <Field label="Last name" value={account.lastName} />
              <Field label="Phone" value={account.phoneNumber} mono />
              <Field label="Email" value={account.email} mono />
              <Field label="Account #" value={account.accountNumber} mono />
              <Field label="Whitelabel" value={whitelabel} mono />
              <Field label="Identifier" value={account.identifier} mono />
              <Field label="Slug" value={account.slug} mono />
            </div>

            <p className="mb-3.5 mt-6 text-[13px] font-semibold text-ink">
              Geography
            </p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field
                label="Country"
                value={account.countryName ?? account.countryCode}
              />
              <Field label="Region" value={account.region} />
              <Field label="District" value={account.district} />
              <Field label="Ward" value={account.ward} />
              <Field label="Area code" value={account.areaCode} mono />
            </div>
          </SectionCard>

          <SectionCard title="Timestamps">
            <DefList>
              <DefRow label="Created" value={formatDateTime(account.createdAt)} />
              <DefRow
                label="Email verified"
                value={account.emailVerified ? "Yes" : "No"}
                tone={account.emailVerified ? "pos" : "warn"}
              />
              <DefRow
                label="Phone verified"
                value={
                  account.phoneNumber
                    ? account.phoneVerified
                      ? "Yes"
                      : "No"
                    : "—"
                }
                tone={
                  account.phoneVerified
                    ? "pos"
                    : account.phoneNumber
                      ? "warn"
                      : undefined
                }
              />
              <DefRow label="Updated" value={formatDateTime(account.updatedAt)} />
            </DefList>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Internal-account badge ───────────────────────────────────────────
// Purple, distinct from the green/red status pill — flags an account that is
// excluded from SaaS analytics (test / demo / employee).
function InternalBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-[12px] font-semibold text-[#7C3AED]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Internal
    </span>
  );
}

// ── Header status badge ──────────────────────────────────────────────
// Deleted takes precedence over active/suspended — a soft-deleted account is
// also inactive, but "Deleted" is the state that matters here.
function StatusBadge({ active, deleted }: { active: boolean; deleted?: boolean }) {
  const label = deleted ? "Deleted" : active ? "Active" : "Suspended";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        deleted
          ? "bg-destructive/10 text-destructive"
          : active
            ? "bg-pos-tint text-pos"
            : "bg-neg-tint text-neg",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ── KPI strip cell ───────────────────────────────────────────────────
function KCell({
  label,
  value,
  cur,
  sub,
  small,
}: {
  label: string;
  value: string;
  cur?: string;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-[18px]">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-baseline gap-1.5 font-bold tracking-[-0.02em] text-ink tabular-nums",
          small ? "text-[16px]" : "text-[20px]",
        )}
      >
        {cur && (
          <span className="text-[11px] font-semibold text-ink-3">{cur}</span>
        )}
        <span>{value}</span>
        {sub && (
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Profile field ────────────────────────────────────────────────────
function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 tracking-[-0.01em]",
          mono ? "break-all font-mono text-[13px]" : "text-[14px]",
          empty ? "text-muted-2" : "text-ink",
        )}
      >
        {empty ? "—" : value}
      </div>
    </div>
  );
}

// ── Billing status badge (per-entity best-of rollup) ────────────────
function BillingStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cfg = s === "ACTIVE"
    ? { bg: "bg-pos-tint", text: "text-pos" }
    : s === "TRIAL"
      ? { bg: "bg-[hsl(var(--warn)_/_0.1)]", text: "text-warn" }
      : s === "PAST_DUE"
        ? { bg: "bg-[hsl(var(--warn)_/_0.1)]", text: "text-warn" }
        : { bg: "bg-neg-tint", text: "text-neg" };
  const label = s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ── Billing rollup (account = owner; each unit billed on its own plan) ──
function BillingRollupCard({
  billing,
  stub,
}: {
  billing: AccountBillingRollup;
  stub?: boolean;
}) {
  const bt = billing.byType;
  // Only break the mix out when there's more than locations to show —
  // otherwise "By type" just restates "Billable units".
  const showByType = bt.warehouses > 0 || bt.stores > 0;
  const byTypeParts = [
    bt.locations > 0 ? `${bt.locations} loc` : null,
    bt.warehouses > 0 ? `${bt.warehouses} wh` : null,
    bt.stores > 0 ? `${bt.stores} store` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SectionCard
      title="Billing rollup"
      subtitle="across all businesses · each unit billed on its own plan"
      stub={stub}
    >
      <DefList>
        <DefRow label="Billable units" value={String(billing.billableUnits)} />
        {showByType && (
          <DefRow
            label="By type"
            rawValue
            value={
              <span className="font-mono text-[12px] text-ink">
                {byTypeParts}
              </span>
            }
          />
        )}
        <DefRow
          label="Active subscriptions"
          value={String(billing.activeSubscriptions)}
          tone={billing.activeSubscriptions > 0 ? "pos" : "default"}
        />
        <DefRow
          label="Open trials"
          value={String(billing.openTrials)}
          tone={billing.openTrials > 0 ? "warn" : "default"}
        />
        <DefRow
          label="MRR"
          value={`${billing.mrr.currency} ${billing.mrr.value}`}
        />
        {billing.billingStatus && (
          <DefRow
            label="Billing status"
            rawValue
            value={<BillingStatusBadge status={billing.billingStatus} />}
          />
        )}
        {billing.planMix.length > 0 && (
          <DefRow
            label="Plan mix"
            rawValue
            value={
              <span className="font-mono text-[12px] text-ink">
                {billing.planMix.map((p) => `${p.label} ×${p.count}`).join(" · ")}
              </span>
            }
          />
        )}
        <DefRow
          label="Lifetime billed"
          value={billing.lifetimeBilled.value}
          tone={billing.lifetimeBilled.tone}
        />
        <DefRow
          label="Outstanding"
          value={billing.outstanding.value}
          tone={billing.outstanding.tone}
        />
        <DefRow
          label="Payment method"
          value={billing.paymentMethod.value}
          tone={billing.paymentMethod.tone}
        />
      </DefList>
    </SectionCard>
  );
}
