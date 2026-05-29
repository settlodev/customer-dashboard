import { History } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { ActivityTable } from "@/components/reports/stock/activity-table";
import { getAuditLogByLocation } from "@/lib/actions/audit-log-actions";

interface Props {
  page: number;
  limit: number;
  from: string;
  to: string;
}

const fmt = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Activity — server-paged audit log of every inventory mutation in the
 * selected period.
 *
 * Pagination is delegated to the backend (`getAuditLogByLocation`
 * accepts `page`, `size`, `from`, `to`). The date range filters the
 * query — switching to "today" returns only today's events, etc.
 */
export async function ActivityTab({ page, limit, from, to }: Props) {
  const result = await getAuditLogByLocation(page - 1, limit, from, to);

  if (result.totalElements === 0) {
    return <NoItems itemName="activity" />;
  }

  return (
    <>
      <KpiStrip cols={2}>
        <KpiCard
          icon={<History className="h-3 w-3" />}
          label="Events on this page"
          value={fmt(result.content.length)}
          delta={`Page ${result.number + 1} of ${Math.max(1, result.totalPages)}`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<History className="h-3 w-3" />}
          label="Total events"
          value={result.totalElements > 0 ? fmt(result.totalElements) : "—"}
          delta="In selected range"
          deltaTone="neutral"
        />
      </KpiStrip>

      <ActivityTable
        data={result.content}
        pageCount={Math.max(1, result.totalPages)}
        pageNo={result.number}
        total={result.totalElements}
      />
    </>
  );
}
