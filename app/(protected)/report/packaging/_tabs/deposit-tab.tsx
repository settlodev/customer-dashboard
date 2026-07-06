import { Coins, PackageCheck, PackageMinus, PackageOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { DataTable } from "@/components/tables/data-table";
import { buildPackagingDepositColumns } from "@/components/tables/reports/packaging/deposit-columns";
import NoItems from "@/components/layouts/no-items";
import { getPackagingReport } from "@/lib/actions/inventory-analytics-actions";

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Deposit & empties — per-item snapshot of returnable-container deposits:
 * how much liability is on the books, how many empties are sitting on
 * hand, and the returnable/consumable split across packaging SKUs.
 *
 * `getPackagingReport` takes no date params — like the stock report's
 * "levels" tab, this is always a live read of current balances, not
 * scoped to the page's from/to range (that range only drives the Flow tab).
 */
export async function DepositTab() {
  const report = await getPackagingReport();

  if (report.packagingItemCount === 0) {
    return <NoItems itemName="packaging stock" />;
  }

  const columns = buildPackagingDepositColumns({ currency: report.currency });

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Coins className="h-3 w-3" />}
          label="Deposit liability"
          value={fmt(report.totalDepositLiability)}
          unit={report.currency}
          delta="Owed on returnable containers"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackageOpen className="h-3 w-3" />}
          label="Packaging on hand"
          value={fmt(report.totalEmpties)}
          delta={`${fmt(report.packagingItemCount)} packaging SKUs`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackageCheck className="h-3 w-3" />}
          label="Returnable"
          value={fmt(report.returnableCount)}
          delta="Deposit-bearing SKUs"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<PackageMinus className="h-3 w-3" />}
          label="Consumed"
          value={fmt(report.consumableCount)}
          delta="No deposit charged"
          deltaTone="neutral"
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <DataTable
            columns={columns}
            data={report.items}
            searchKey="variantName"
            clientMode
          />
        </CardContent>
      </Card>
    </>
  );
}
