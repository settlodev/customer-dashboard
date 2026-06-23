import { Users, UserCheck } from "lucide-react";

import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { getMyReferralStats } from "@/lib/actions/referral-agent";
import type { ReferralAgentSelfResponse } from "@/types/referral-agent";

export const metadata = {
  title: "Your referrals",
};

export default async function ReferralPage() {
  let stats: ReferralAgentSelfResponse | null = null;
  let loadError: string | null = null;
  try {
    stats = await getMyReferralStats();
  } catch (error: any) {
    loadError = error?.message ?? "We couldn't load your referral stats.";
  }

  return (
    <PageShell>
      <PageHeader
        title="Your referrals"
        subtitle="Share your referral code to onboard new customers and track your sign-ups."
      />
      <PageBody>
        {loadError || !stats ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {loadError ?? "No referral profile is linked to your account."}
          </p>
        ) : (
          <>
            <KpiStrip cols={2}>
              <KpiCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="Total referrals"
                value={stats.totalReferrals.toLocaleString()}
              />
              <KpiCard
                icon={<UserCheck className="h-3.5 w-3.5" />}
                label="Active referrals"
                value={stats.activeReferrals.toLocaleString()}
              />
            </KpiStrip>

            <div className="rounded-xl border border-line bg-card p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Your referral code
              </div>
              <div className="mt-2 font-mono text-[22px] font-semibold tracking-[0.04em] text-ink">
                {stats.referralCode ?? "—"}
              </div>
              <p className="mt-2 font-mono text-[12px] text-muted-foreground">
                New customers who sign up with this code are attributed to you.
              </p>
            </div>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
