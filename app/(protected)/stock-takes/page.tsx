import Link from "next/link";
import {
  Plus,
  Lock,
  ClipboardCheck,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-take/columns";
import { getStockTakes } from "@/lib/actions/stock-take-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import type { CycleCountType, StockTakeStatus } from "@/types/stock-take/type";
import CycleCountTypeFilter from "@/components/widgets/stock-take/cycle-count-filter";

const STATUS_VALUES: StockTakeStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
  "CANCELLED",
];

const CYCLE_COUNT_VALUES: CycleCountType[] = ["FULL", "ABC_CLASS", "RANDOM", "ZONE"];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    cycleCountType?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);
  const cycleCountType = CYCLE_COUNT_VALUES.find((c) => c === resolvedParams.cycleCountType);

  const [responseData, config] = await Promise.all([
    getStockTakes(page ? page - 1 : 0, pageLimit, status, cycleCountType),
    getLocationConfig(),
  ]);

  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;
  const cycleCountingEnabled = config?.cycleCountingEnabled ?? false;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Takes" }]} />
      <PageHeader
        title="Stock Takes"
        subtitle="Cycle counts and physical inventory reconciliation."
        actions={
          cycleCountingEnabled ? (
            <>
              <CycleCountTypeFilter />
              <Button asChild size="sm">
                <Link href="/stock-takes/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Stock Take
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <PageBody>
        {!cycleCountingEnabled && (
          <Alert tone="warning">
            <AlertIcon>
              <Lock className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Cycle counting disabled</AlertTitle>
              <AlertDescription>
                Enable it in location settings before running stock takes.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}

        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ClipboardCheck className="h-3 w-3" />}
            label="Open takes"
            value="3"
            unit="active"
            delta="2 in progress"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Activity className="h-3 w-3" />}
            label="Counts (30d)"
            value="14"
            delta="+3 wk"
            deltaTone="pos"
            spark={[2, 3, 4, 5, 7, 8, 10, 12]}
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="Avg accuracy"
            value="98.6"
            unit="%"
            delta="+0.4 pts"
            deltaTone="pos"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Variances flagged"
            value="7"
            delta="needs review"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || status || cycleCountType ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="takeNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            filterKey="status"
            filterOptions={STATUS_VALUES.map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            }))}
          />
        ) : cycleCountingEnabled ? (
          <NoItems newItemUrl="/stock-takes/new" itemName="stock takes" />
        ) : null}
      </PageBody>
    </PageShell>
  );
}
