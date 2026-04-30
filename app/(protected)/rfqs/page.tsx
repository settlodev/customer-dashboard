import Link from "next/link";
import {
  Plus,
  Lock,
  FileText,
  Inbox,
  Clock,
  ShieldCheck,
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
import { columns } from "@/components/tables/rfq/columns";
import { getRfqs } from "@/lib/actions/rfq-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import type { RfqStatus } from "@/types/rfq/type";

const STATUS_VALUES: RfqStatus[] = [
  "DRAFT",
  "SENT",
  "QUOTES_RECEIVED",
  "EVALUATED",
  "AWARDED",
  "CONVERTED_TO_LPO",
  "CANCELLED",
  "EXPIRED",
];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);

  const [responseData, config] = await Promise.all([
    getRfqs(page ? page - 1 : 0, pageLimit, status),
    getLocationConfig(),
  ]);

  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;
  const rfqEnabled = config?.rfqEnabled ?? false;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Requests for Quotation" }]} />
      <PageHeader
        title="Requests for Quotation"
        subtitle="Raise quotes from multiple suppliers, evaluate, and award."
        actions={
          rfqEnabled ? (
            <Button asChild size="sm">
              <Link href="/rfqs/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New RFQ
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        {!rfqEnabled && (
          <Alert tone="warning">
            <AlertIcon>
              <Lock className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>RFQs disabled</AlertTitle>
              <AlertDescription>
                Ask an admin to toggle{" "}
                <code className="font-mono">rfqEnabled</code> in location
                settings to raise quotes from multiple suppliers.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}

        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<FileText className="h-3 w-3" />}
            label="Open RFQs"
            value="6"
            unit="active"
            delta="2 awaiting quotes"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Inbox className="h-3 w-3" />}
            label="Quotes received (30d)"
            value="38"
            delta="+12 wk"
            deltaTone="pos"
            spark={[6, 10, 14, 18, 22, 28, 34, 38]}
          />
          <KpiCard
            icon={<Clock className="h-3 w-3" />}
            label="Avg quote turnaround"
            value="2.1"
            unit="days"
            delta="−0.5 d"
            deltaTone="pos"
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="Awarded (30d)"
            value="11"
            delta="92% on time"
            deltaTone="pos"
          />
        </KpiStrip>

        {total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="rfqNumber"
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
        ) : rfqEnabled ? (
          <NoItems newItemUrl="/rfqs/new" itemName="RFQs" />
        ) : null}
      </PageBody>
    </PageShell>
  );
}
