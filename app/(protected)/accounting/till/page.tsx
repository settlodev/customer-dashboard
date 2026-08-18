import { CheckCircle2, Coins, Hourglass } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { columns } from "@/components/tables/till/columns";
import { listTillReconciliations } from "@/lib/actions/till-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number, c: string) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

export default async function TillPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the backend's 0-based index and match the size default.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listTillReconciliations(location.id, apiPage, size)
    : null;
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;

  const submittedCount = data.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = data.filter((r) => r.status === "APPROVED").length;
  const totalVariance = data.reduce((s, r) => s + Math.abs(r.variance ?? 0), 0);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Till reconciliation" }]}
      />
      <PageHeader
        title="Till reconciliation"
        subtitle="End-of-day cash counts vs expected — variance posts to the GL on approval."
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems itemName="till reconciliations" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<Hourglass className="h-3 w-3" />}
                label="Awaiting approval"
                value={String(submittedCount)}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CheckCircle2 className="h-3 w-3" />}
                label="Approved on page"
                value={String(approvedCount)}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Total |variance|"
                value={fmt(totalVariance, data[0]?.currency ?? "")}
                deltaTone={totalVariance > 0 ? "neg" : "pos"}
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  defaultPageSize={size}
                  pageNo={apiPage}
                  total={total}
                  searchKey="businessDate"
                  hideSearch
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
