import Link from "next/link";
import { LayoutGrid, Plus, Table2, Users, CheckCircle2, XCircle } from "lucide-react";

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
import { searchSpaces, fetchAllSpaces } from "@/lib/actions/space-actions";
import { columns } from "@/components/tables/space/columns";
import { SPACE_TYPES, BOOKABLE_TYPES } from "@/types/space/type";
import { TableSpaceType } from "@/types/enums";
import SpacesFilterChips from "@/components/spaces/filter-chips";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    types?: string;
    parent?: string;
  }>;
};

function expandTypeAlias(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const expanded: string[] = [];
  for (const tok of tokens) {
    if (tok.toLowerCase() === "spaces") {
      expanded.push(...SPACE_TYPES);
    } else if (tok.toLowerCase() === "tables") {
      expanded.push(...BOOKABLE_TYPES);
    } else {
      expanded.push(tok as TableSpaceType);
    }
  }
  return expanded.length > 0 ? expanded : undefined;
}

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search || "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 10;
  const types = expandTypeAlias(resolved.types);
  const parent = resolved.parent;
  const topLevel = parent === "top";
  const parentSpaceId = parent && parent !== "top" ? parent : undefined;

  const [responseData, allSpaces] = await Promise.all([
    searchSpaces(q, page, pageLimit, types, parentSpaceId, topLevel),
    fetchAllSpaces().catch(() => []),
  ]);

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  // Roll-up metrics over the *full* list so the KPI strip stays accurate
  // regardless of which filter / page the table is currently showing.
  const totalAll = allSpaces.length;
  const tablesCount = allSpaces.filter((s) =>
    BOOKABLE_TYPES.includes(s.type),
  ).length;
  const spacesCount = allSpaces.filter((s) =>
    SPACE_TYPES.includes(s.type),
  ).length;
  const activeCount = allSpaces.filter((s) => s.active).length;
  const inactiveCount = totalAll - activeCount;
  const totalCapacity = allSpaces
    .filter((s) => BOOKABLE_TYPES.includes(s.type))
    .reduce((sum, s) => sum + (s.capacity ?? 0), 0);

  const parentOptions = allSpaces.filter((s) => SPACE_TYPES.includes(s.type));

  const hasFilters = !!(q || resolved.types || resolved.parent);
  const hasAny = totalAll > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Tables & Spaces" }]} />
      <PageHeader
        title="Tables & Spaces"
        subtitle="Manage tables, sections, and floor layout for this location."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/spaces/manage">
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                Floor plans & combinations
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/spaces/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add table / space
              </Link>
            </Button>
          </>
        }
      />

      <PageBody>
        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Total"
                value={totalAll.toLocaleString()}
              />
              <KpiCard
                icon={<Table2 className="h-3 w-3" />}
                label="Tables"
                value={tablesCount.toLocaleString()}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<LayoutGrid className="h-3 w-3" />}
                label="Spaces"
                value={spacesCount.toLocaleString()}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Capacity"
                value={
                  totalCapacity > 0 ? totalCapacity.toLocaleString() : "—"
                }
                unit={totalCapacity > 0 ? "seats" : undefined}
                deltaTone="neutral"
              />
              <KpiCard
                icon={
                  inactiveCount > 0 ? (
                    <XCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )
                }
                label="Inactive"
                value={
                  inactiveCount > 0 ? inactiveCount.toLocaleString() : "—"
                }
                deltaTone={inactiveCount > 0 ? "neg" : "neutral"}
                delta={
                  inactiveCount > 0
                    ? `${activeCount.toLocaleString()} active`
                    : undefined
                }
              />
            </KpiStrip>

            <SpacesFilterChips
              currentTypes={resolved.types ?? ""}
              currentParent={parent ?? ""}
              parentOptions={parentOptions.map((p) => ({
                id: String(p.id),
                name: p.name,
              }))}
            />

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
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
          <NoItems itemName="table or space" newItemUrl="/spaces/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
