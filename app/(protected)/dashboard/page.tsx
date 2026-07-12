import Dashboard from "@/components/dashboard/Dashboard";
import { PageShell } from "@/components/layouts/page-shell";
import {
    getCurrentBusiness,
    getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import { getOutstandingPrepaidLiability } from "@/lib/actions/prepayment-analytics-actions";
import { resolveCurrentBusinessDate } from "@/lib/actions/dashboard-action";
import { getAuthToken } from "@/lib/auth-utils";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoan, getLoanEligibility } from "@/lib/actions/loans-actions";
import { getLoanAccess } from "@/lib/loans/access";
import { hasReportsReadAll } from "@/lib/permissions/me";
import { EligibilityHero } from "@/components/loans/eligibility-hero";
import { formatRangeLabel } from "@/lib/date-range";
import { format } from "date-fns";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const params = await searchParams;
    const authToken = await getAuthToken();
    const [location, business] = await Promise.all([
        getCurrentLocation(),
        getCurrentBusiness(),
    ]);
    const [summary, prepaid, businessDate] = await Promise.all([
        location?.id
            ? getInventoryDashboardSummary(location.id, "TZS")
            : Promise.resolve(null),
        business?.id
            ? getOutstandingPrepaidLiability(business.id)
            : Promise.resolve(null),
        location?.id
            ? resolveCurrentBusinessDate(location.id)
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

    // Default window: the current business day (from the day session) when the
    // URL carries no explicit range — the same shared filter the reports use,
    // but anchored to the business day so the current till session isn't split
    // off by the calendar boundary (which read the expenses total as zero). A
    // preset/custom pick overrides through the `from`/`to` query params.
    const fallbackDate = businessDate ?? format(new Date(), "yyyy-MM-dd");
    const from = params.from ?? fallbackDate;
    const to = params.to ?? fallbackDate;

    const placeName = location?.name ?? business?.name ?? "your business";
    const firstName = authToken?.firstName?.trim() || "there";
    // Echo the selected period next to the greeting; the shared date filter in
    // the header is the control that changes it.
    const greetingSubtitle = `Here's how ${placeName} is doing — ${formatRangeLabel(from, to)}`;

    const reportsReadAll = await hasReportsReadAll();

    return (
        <PageShell>
            <Dashboard
                locationId={location?.id ?? null}
                inventorySummary={summary}
                prepaid={prepaid}
                reportsReadAll={reportsReadAll}
                greetingTitle={`Habari, ${firstName} 👋`}
                greetingSubtitle={greetingSubtitle}
                from={from}
                to={to}
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
