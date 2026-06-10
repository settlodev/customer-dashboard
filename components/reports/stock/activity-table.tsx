"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { auditColumns } from "@/components/tables/reports/stock/audit-columns";
import type { AuditLogEntry } from "@/types/audit-log/type";

interface Props {
  data: AuditLogEntry[];
  pageCount: number;
  pageNo: number;
  total: number;
}

/**
 * Activity (audit-log) table — paginated server-side via
 * `getAuditLogByLocation(page, size, from, to)`. Search is hidden: the
 * audit-log endpoint filters by date range only, with no free-text search,
 * so the box would have done nothing.
 */
export function ActivityTable({ data, pageCount, pageNo, total }: Props) {
  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable
          columns={auditColumns}
          data={data}
          pageCount={pageCount}
          pageNo={pageNo}
          searchKey="entityType"
          total={total}
          hideSearch
        />
      </CardContent>
    </Card>
  );
}
