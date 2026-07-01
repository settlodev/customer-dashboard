import Dashboard from "@/components/dashboard/Dashboard";
import { PageShell } from "@/components/layouts/page-shell";
import {
    getCurrentBusiness,
    getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import { getOutstandingPrepaidLiability } from "@/lib/actions/prepayment-analytics-actions";
import { getAuthToken } from "@/lib/auth-utils";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoan, getLoanEligibility } from "@/lib/actions/loans-actions";
import { getLoanAccess } from "@/lib/loans/access";
import { hasReportsReadAll } from "@/lib/permissions/me";
import { EligibilityHero } from "@/components/loans/eligibility-hero";

export default async function DashboardPage() {
    const authToken = await getAuthToken();
    const [location, business] = await Promise.all([
        getCurrentLocation(),
        getCurrentBusiness(),
    ]);
    const [summary, prepaid] = await Promise.all([
        location?.id
            ? getInventoryDashboardSummary(location.id, "TZS")
            : Promise.resolve(null),
        business?.id
            ? getOutstandingPrepaidLiability(business.id)
            : Promise.resolve(null),
    ]);

    // Loans eligibility hero (feature-flagged + permission-gated). Shown only
    // to users who hold loans:read; the Apply CTA needs loans:apply.
    const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;
    const loanEligibility =
        LOANS_ENABLED && loanAccess?.canRead ? await getLoanEligibility() : null;
    const activeLoan =
        loanEligibility?.hasActiveLoan && loanEligibility.activeLoanId
            ? await getLoan(loanEligibility.activeLoanId)
            : null;

    const placeName = location?.name ?? business?.name ?? "your business";
    const firstName = authToken?.firstName?.trim() || "there";
    const dateLabel = new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    const reportsReadAll = await hasReportsReadAll();

    return (
        <PageShell>
            <Dashboard
                locationId={location?.id ?? null}
                inventorySummary={summary}
                prepaid={prepaid}
                reportsReadAll={reportsReadAll}
                greetingTitle={`Habari, ${firstName} 👋`}
                greetingSubtitle={`Here's how ${placeName} is doing today — ${dateLabel}`}
                financingSlot={
                    LOANS_ENABLED && loanAccess?.canRead && loanEligibility ? (
                        <EligibilityHero
                            eligibility={loanEligibility}
                            activeLoan={activeLoan}
                            canApply={loanAccess.canApply}
                        />
                    ) : null
                }
            />
        </PageShell>
    );
}
