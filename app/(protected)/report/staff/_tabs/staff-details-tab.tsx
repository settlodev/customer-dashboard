import { ShoppingCart, Users, Package } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { reportColumns } from "@/components/tables/reports/sales-by-staff/report-columns";
import { StaffSearchBox } from "@/components/reports/staffs/staff-search-box";
import type { StaffSummaryReport } from "@/types/staff";

interface Props {
  report: StaffSummaryReport | null;
  search: string;
  page: number;
  limit: number;
}

export function StaffDetailsTab({ report, search, page, limit }: Props) {
  const rows = (report?.staffReports ?? []).map((s) => ({ ...s, id: s.id }));
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((s) => s.name.toLowerCase().includes(q))
    : rows;

  if (rows.length === 0 && q === "") {
    return <NoItems itemName="staff sales for this period" />;
  }

  const totals = rows.reduce(
    (acc, s) => ({
      orders: acc.orders + s.totalOrdersCompleted,
      items: acc.items + s.totalItemsSold,
      intakes: acc.intakes + (s.totalStockIntakePerformed ?? 0),
    }),
    { orders: 0, items: 0, intakes: 0 },
  );

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const startIdx = (page - 1) * limit;
  const pageData = filtered.slice(startIdx, startIdx + limit);

  return (
    <div className="space-y-6">
      <KpiStrip cols={3}>
        <KpiCard
          icon={<Users className="h-3 w-3" />}
          label="Staff"
          value={rows.length.toLocaleString()}
        />
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Orders"
          value={totals.orders > 0 ? totals.orders.toLocaleString() : "—"}
        />
        <KpiCard
          icon={<Package className="h-3 w-3" />}
          label="Stock intakes"
          value={totals.intakes > 0 ? totals.intakes.toLocaleString() : "—"}
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              All staff — {total} member{total === 1 ? "" : "s"}
            </p>
            {/*<StaffSearchBox defaultValue={search} />*/}
          </div>

          <DataTable
            columns={reportColumns}
            data={pageData}
            searchKey="name"
            pageNo={page - 1}
            total={total}
            pageCount={pageCount}
            rowClickBasePath="/staff"
          />
        </CardContent>
      </Card>
    </div>
  );
}
