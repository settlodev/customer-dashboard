import Link from "next/link";
import {
  CheckCircle2,
  LayoutGrid,
  Plus,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { searchSpaces, getSpaceStats } from "@/lib/actions/space-actions";
import { softFetch } from "@/lib/list-fallback";
import { spaceColumns } from "@/components/tables/space/columns";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

const EMPTY_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  floorPlansUsed: 0,
  tablesInZones: 0,
};

export default async function SpacesPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search || "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 10;

  const [responseData, stats] = await Promise.all([
    softFetch(searchSpaces(q, page, pageLimit)),
    getSpaceStats().catch(() => EMPTY_STATS),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const totalZones = stats.total;
  const activeZones = stats.active;
  const inactiveZones = stats.inactive;
  const tablesInZones = stats.tablesInZones;
  const floorPlansUsed = stats.floorPlansUsed;

  const hasFilters = !!q;
  const hasAny = totalZones > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Spaces" }]} />
      <PageHeader
        title="Spaces"
        subtitle="Sections, halls, rooms, terraces, and bars — the zones that group your tables."
        actions={
          <Button asChild size="sm">
            <Link href="/spaces/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add space
            </Link>
          </Button>
        }
      />

      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="spaces" />
        ) : hasAny || hasFilters ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Total spaces"
                value={totalZones.toLocaleString()}
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Tables in spaces"
                value={tablesInZones > 0 ? tablesInZones.toLocaleString() : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Floor plans used"
                value={floorPlansUsed > 0 ? floorPlansUsed.toLocaleString() : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={
                  inactiveZones > 0 ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )
                }
                label="Inactive"
                value={inactiveZones > 0 ? inactiveZones.toLocaleString() : "—"}
                deltaTone={inactiveZones > 0 ? "neg" : "neutral"}
                delta={
                  inactiveZones > 0
                    ? `${activeZones.toLocaleString()} active`
                    : undefined
                }
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={spaceColumns}
                  data={data}
                  pageCount={pageCount}
                  pageNo={page}
                  searchKey="name"
                  total={total}
                  rowClickBasePath="/spaces"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="space" newItemUrl="/spaces/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
