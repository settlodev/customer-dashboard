import Dashboard from "@/components/dashboard/Dashboard";
import { PageShell } from "@/components/layouts/page-shell";
import {
    getCurrentBusiness,
    getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import { getOutstandingPrepaidLiability } from "@/lib/actions/prepayment-analytics-actions";
import { resolveCurrentBusinessDate } from "@/lib/actions/dashboard-action";
import { listNotifications } from "@/lib/actions/notification-actions";
import { toActivityItems } from "@/lib/dashboard/recent-activity";
import { getReorderSuggestions } from "@/lib/actions/inventory-analytics-actions";
import { getAuthToken } from "@/lib/auth-utils";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoan, getLoanEligibility } from "@/lib/actions/loans-actions";
import { getLoanAccess } from "@/lib/loans/access";
import { hasReportsReadAll } from "@/lib/permissions/me";
import { EligibilityHero } from "@/components/loans/eligibility-hero";
import { format } from "date-fns";

/**
 * Time-of-day greeting resolved in the given IANA timezone (the active
 * location's `timezone`, falling back to EAT — Settlo's home market). Computed
 * server-side and passed down as a plain string, so the greeting is identical
 * on the server and the client render (no hydration split from reading the
 * clock inside a client component).
 */
function getTimeOfDayGreeting(timezone?: string | null): string {
    const hourIn = (tz: string) =>
        Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                hourCycle: "h23",
                hour: "numeric",
            }).format(new Date()),
        );
    let hour: number;
    try {
        hour = hourIn(timezone?.trim() || "Africa/Dar_es_Salaam");
    } catch {
        // Unknown/invalid tz string on the location — fall back to EAT.
        hour = hourIn("Africa/Dar_es_Salaam");
    }
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

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
    const [summary, prepaid, businessDate, notifPage, reorderSuggestions] =
        await Promise.all([
            location?.id
                ? getInventoryDashboardSummary(location.id, "TZS")
                : Promise.resolve(null),
            business?.id
                ? getOutstandingPrepaidLiability(business.id)
                : Promise.resolve(null),
            location?.id
                ? resolveCurrentBusinessDate(location.id)
                : Promise.resolve(null),
            // Owner notification feed → Recent activity card (business-scoped;
            // the action returns an empty page when no business is selected).
            listNotifications(0, 6),
            // Reorder-soon list (location-scoped; action swallows errors to []).
            location?.id ? getReorderSuggestions() : Promise.resolve([]),
        ]);
    const recentActivity = toActivityItems(notifPage.content);

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

    const firstName = authToken?.firstName?.trim() || "there";
    const greeting = getTimeOfDayGreeting(location?.timezone);

    // Identity subline shown under the greeting (venue · branch · city) — the
    // design's "Masaki Bar & Lounge · Dar es Salaam · Terminal 02" line, built
    // from whatever fields we have and de-duped. The date range now lives in
    // the header's segmented control, so it's no longer echoed here.
    const venue =
        business?.name ?? location?.businessName ?? location?.name ?? "your business";
    const branch = location?.name?.trim();
    const city = (location?.region || location?.district || "").trim();
    const subline = [
        venue,
        branch && branch !== venue ? branch : null,
        city || null,
    ]
        .filter(Boolean)
        .join(" · ");

    const reportsReadAll = await hasReportsReadAll();

    return (
        <PageShell>
            <Dashboard
                locationId={location?.id ?? null}
                inventorySummary={summary}
                prepaid={prepaid}
                reportsReadAll={reportsReadAll}
                greeting={greeting}
                userName={firstName}
                subline={subline}
                recentActivity={recentActivity}
                reorderSuggestions={reorderSuggestions}
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
