import Link from "next/link";
import { FileText, Plus, Send, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";
import { columns } from "@/components/tables/proforma/columns";
import { listProformas } from "@/lib/actions/invoicing-proforma-actions";
import { type Proforma } from "@/types/invoicing/type";
import { ProformaStatusTabs } from "@/components/tables/proforma/status-tabs";

interface SearchParams {
  page?: string;
  limit?: string;
  status?: string;
}

export default async function ProformaInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  // Match the DataTable's rows-per-page default so the "10" label isn't a lie
  // and the pager doesn't collapse to 1/1 on lists of 11–20 rows.
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;
  const status = params.status || undefined;

  const response = await softFetch(
    listProformas({ status, page: apiPage, size }),
  );

  const data: Proforma[] = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;

  const pageValue = data.reduce((s, p) => s + (p.totalAmount ?? 0), 0);
  const sentCount = data.filter((p) => p.status === "SENT").length;
  const convertedCount = data.filter((p) => p.status === "CONVERTED").length;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Proforma invoices" }]} />
      <PageHeader
        title="Proforma invoices"
        subtitle="Quote customers, then convert accepted proformas into invoices."
        actions={
          <Button asChild size="sm">
            <Link href="/proforma-invoices/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New proforma
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!response ? (
          <DataLoadError itemName="proforma invoices" />
        ) : total > 0 || status ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<FileText className="h-3 w-3" />}
                label="Proformas"
                value={String(total)}
                delta={`${data.length} on page`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ShoppingBag className="h-3 w-3" />}
                label="Page value"
                value={fmt(pageValue)}
                unit={data[0]?.currencyCode ?? ""}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Send className="h-3 w-3" />}
                label="Sent on page"
                value={sentCount > 0 ? String(sentCount) : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<FileText className="h-3 w-3" />}
                label="Converted on page"
                value={convertedCount > 0 ? String(convertedCount) : "—"}
                deltaTone="pos"
              />
            </KpiStrip>

            <ProformaStatusTabs />

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  defaultPageSize={size}
                  pageNo={apiPage}
                  total={total}
                  searchKey="proformaNumber"
                  hideSearch
                  rowClickBasePath="/proforma-invoices"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems
            itemName="proforma invoices"
            newItemUrl="/proforma-invoices/new"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
