import Link from "next/link";
import { BookOpen, Plus, ShieldCheck, ShieldAlert } from "lucide-react";

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
import { columns } from "@/components/tables/journal-entry/columns";
import { listJournalEntries } from "@/lib/actions/journal-entry-actions";
import {
  JOURNAL_ENTRY_STATUS_LABELS,
  type JournalEntryStatus,
} from "@/types/journal-entry/type";

const STATUS_FILTERS: { value: JournalEntryStatus; label: string }[] = (
  Object.keys(JOURNAL_ENTRY_STATUS_LABELS) as JournalEntryStatus[]
).map((s) => ({ value: s, label: JOURNAL_ENTRY_STATUS_LABELS[s] }));

interface SearchParams {
  page?: string;
  limit?: string;
  status?: JournalEntryStatus;
}

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // The shared DataTable writes a 1-based `?page` and defaults its rows-per-page
  // control to 10. Mirror both: convert to the backend's 0-based page index, and
  // default the fetch size to 10 so the "Rows: 10" label matches what's actually
  // loaded. (Fetching 20 against a 10 label collapsed the pager to 1/1 and made
  // every entry render on one page, and the missing -1 skipped the 2nd page.)
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  const response = await listJournalEntries({
    page: apiPage,
    size,
    status: params.status,
  });

  const data = response.content ?? [];
  const total = response.totalElements ?? 0;
  const pageCount = response.totalPages ?? 0;

  const draftCount = data.filter((e) => e.status === "DRAFT").length;
  const postedCount = data.filter((e) => e.status === "POSTED").length;
  const unbalancedCount = data.filter((e) => !e.balanced).length;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Accounting" },
          { title: "Journal entries" },
        ]}
      />
      <PageHeader
        title="Journal entries"
        subtitle="Double-entry ledger postings — auto-generated and manual."
        actions={
          <Button asChild size="sm">
            <Link href="/accounting/journal-entries/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New entry
            </Link>
          </Button>
        }
      />
      <PageBody>
        {total > 0 || params.status ? (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<BookOpen className="h-3 w-3" />}
                label="Drafts on page"
                value={String(draftCount)}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ShieldCheck className="h-3 w-3" />}
                label="Posted on page"
                value={String(postedCount)}
                deltaTone="pos"
              />
              <KpiCard
                icon={<ShieldAlert className="h-3 w-3" />}
                label="Unbalanced"
                value={String(unbalancedCount)}
                deltaTone={unbalancedCount > 0 ? "neg" : "pos"}
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
                  searchKey="entryNumber"
                  filterKey="status"
                  filterOptions={STATUS_FILTERS}
                  rowClickBasePath="/accounting/journal-entries"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems
            itemName="journal entries"
            newItemUrl="/accounting/journal-entries/new"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
