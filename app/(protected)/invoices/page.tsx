import { FileText, CircleDollarSign, AlertTriangle, Wallet } from "lucide-react";

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
import { columns } from "@/components/tables/invoice/columns";
import { listInvoices } from "@/lib/actions/invoicing-invoice-actions";
import {
  invoiceBalanceDue,
  isInvoiceOverdue,
  type Invoice,
} from "@/types/invoicing/type";

interface SearchParams {
  page?: string;
  limit?: string;
}

export default async function InvoicesPage({
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

  const response = await softFetch(listInvoices({ page: apiPage, size }));

  const data: Invoice[] = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;

  const pageValue = data.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const outstanding = data.reduce((s, i) => s + invoiceBalanceDue(i), 0);
  const overdueCount = data.filter((i) => isInvoiceOverdue(i)).length;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Invoices" }]} />
      <PageHeader
        title="Invoices"
        subtitle="Customer invoices — issued from accepted proformas, then settled."
      />
      <PageBody>
        {!response ? (
          <DataLoadError itemName="invoices" />
        ) : total > 0 ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<FileText className="h-3 w-3" />}
                label="Invoices"
                value={String(total)}
                delta={`${data.length} on page`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Page value"
                value={fmt(pageValue)}
                unit={data[0]?.currencyCode ?? ""}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Outstanding"
                value={fmt(outstanding)}
                unit={data[0]?.currencyCode ?? ""}
                deltaTone={outstanding > 0 ? "neg" : "pos"}
              />
              <KpiCard
                icon={<AlertTriangle className="h-3 w-3" />}
                label="Overdue on page"
                value={overdueCount > 0 ? String(overdueCount) : "—"}
                deltaTone={overdueCount > 0 ? "neg" : "pos"}
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
                  searchKey="invoiceNumber"
                  hideSearch
                  rowClickBasePath="/invoices"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="invoices" />
        )}
      </PageBody>
    </PageShell>
  );
}
