import Dashboard from "@/components/dashboard/Dashboard";
import { InventoryKpiStrip } from "@/components/widgets/inventory/inventory-kpi-strip";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getInventoryDashboardSummary } from "@/lib/actions/reports-analytics-actions";

export default async function DashboardPage() {
    const location = await getCurrentLocation();
    const summary = location?.id
        ? await getInventoryDashboardSummary(location.id, "TZS")
        : null;

    return (
        <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 min-h-screen space-y-4">
            <InventoryKpiStrip summary={summary} />
            <Dashboard />
        </div>
    );
}
