import Dashboard from "@/components/dashboard/Dashboard";
import { PageShell } from "@/components/layouts/page-shell";
import {
    getCurrentBusiness,
    getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";
import { getOutstandingPrepaidLiability } from "@/lib/actions/prepayment-analytics-actions";

export default async function DashboardPage() {
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

    return (
        <PageShell>
            <Dashboard
                locationId={location?.id ?? null}
                inventorySummary={summary}
                prepaid={prepaid}
            />
        </PageShell>
    );
}
