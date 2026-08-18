import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupplierTable } from "@/components/tables/supplier/table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { listNominations } from "@/lib/actions/supplier-nomination-actions";
import type { SupplierNomination } from "@/types/supplier/nomination";

type Props = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = parseListStatus(params.status);
  const q = (params.search ?? "").trim().toLowerCase();
  const page = Number(params.page) || 0;
  const pageLimit = Number(params.limit) || 25;

  const [all, nominations] = await Promise.all([
    fetchAllSuppliers(),
    listNominations(),
  ]);

  // Latest nomination per supplier (by submittedAt) → which suppliers are
  // currently under review, so the table's marketplace chip can render
  // without a per-row fetch. Computed here from one bulk fetch instead of
  // the table doing one `getNominationsForSupplier` call per row.
  const latestBySupplier = new Map<string, SupplierNomination>();
  for (const n of nominations) {
    const existing = latestBySupplier.get(n.sourceSupplierId);
    if (!existing || new Date(n.submittedAt) > new Date(existing.submittedAt)) {
      latestBySupplier.set(n.sourceSupplierId, n);
    }
  }
  const underReviewSupplierIds = new Set(
    [...latestBySupplier.values()]
      .filter((n) => n.status === "SUBMITTED")
      .map((n) => n.sourceSupplierId),
  );

  const scope =
    status === "archived"
      ? all.filter((s) => !!s.archivedAt)
      : all.filter((s) => !s.archivedAt);

  const filtered = q
    ? scope.filter((s) =>
        [s.name, s.contactPersonName, s.email, s.phone]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
    : scope;

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const pageIndex = page > 0 ? page - 1 : 0;
  const start = pageIndex * pageLimit;
  const data = sorted.slice(start, start + pageLimit);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageLimit));

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Suppliers" }]} />
      <PageHeader
        title="Suppliers"
        subtitle="Vendors that fulfil purchase orders."
        actions={
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add supplier
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/suppliers" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <SupplierTable
                data={data}
                underReviewSupplierIds={underReviewSupplierIds}
                pageCount={pageCount}
                defaultPageSize={pageLimit}
                pageNo={page}
                total={total}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="suppliers" newItemUrl="/suppliers/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
