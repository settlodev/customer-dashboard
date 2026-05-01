import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/units/column";
import { UnitDialog } from "@/components/widgets/unit/unit-dialog";
import { getUnits } from "@/lib/actions/unit-actions";
import { Archive, Layers, Ruler, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitOfMeasure } from "@/types/unit/type";

type UnitFilter = "active" | "archived" | "system" | "all";

type Props = {
  searchParams: Promise<{ filter?: UnitFilter }>;
};

const TAB_DEFS: Array<{
  key: UnitFilter;
  label: string;
  href: string;
}> = [
  { key: "active", label: "My units", href: "/units" },
  { key: "archived", label: "Archived", href: "/units?filter=archived" },
  { key: "system", label: "System", href: "/units?filter=system" },
  { key: "all", label: "All", href: "/units?filter=all" },
];

export default async function UnitsPage({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;
  const all: UnitOfMeasure[] = await getUnits();

  const mine = all.filter((u) => !u.systemGenerated);
  const system = all.filter((u) => u.systemGenerated);
  const active = mine.filter((u) => !u.archivedAt);
  const archived = mine.filter((u) => !!u.archivedAt);

  const distinctTypes = new Set(all.map((u) => u.unitType)).size;

  const scope: UnitOfMeasure[] =
    filter === "archived"
      ? archived
      : filter === "system"
        ? system
        : filter === "all"
          ? all
          : active;

  const data = [...scope].sort((a, b) => a.name.localeCompare(b.name));

  const tabCounts: Record<UnitFilter, number> = {
    active: active.length,
    archived: archived.length,
    system: system.length,
    all: all.length,
  };

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Units of measure" }]} />
      <PageHeader
        title="Units of measure"
        subtitle="Create custom units for your business. System units are read-only and shared across the platform."
        actions={<UnitDialog unit={null} />}
      />
      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Ruler className="h-3 w-3" />}
            label="My units"
            value={active.length.toLocaleString()}
            delta={`${mine.length.toLocaleString()} total custom`}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="System units"
            value={system.length.toLocaleString()}
            delta="shared, read-only"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Archive className="h-3 w-3" />}
            label="Archived"
            value={archived.length.toLocaleString()}
            delta={archived.length === 0 ? "none" : "restorable"}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Unit types in use"
            value={distinctTypes.toLocaleString()}
            unit="of 5"
            delta="weight · volume · length · piece · area"
            deltaTone="neutral"
          />
        </KpiStrip>

        <div
          role="tablist"
          className="inline-flex w-fit flex-wrap items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
        >
          {TAB_DEFS.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  isActive
                    ? "bg-canvas text-ink"
                    : "text-ink-3 hover:text-ink",
                )}
              >
                {tab.label}
                <span className="font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground tabular-nums">
                  {tabCounts[tab.key]}
                </span>
              </Link>
            );
          })}
        </div>

        {data.length > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            pageNo={0}
            total={data.length}
            pageCount={1}
            rowClickBasePath="/units"
            disableArchive
          />
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-card py-16">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
              <div className="rounded-full border border-line bg-canvas p-3 text-muted-foreground">
                <Ruler className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-ink">
                No units in this view
              </h2>
              <p className="font-mono text-[12px] text-muted-foreground">
                {filter === "system"
                  ? "No system units are currently published to your tenant."
                  : "Add a custom unit to get started — name, abbreviation, and a type."}
              </p>
              {filter !== "system" && (
                <div className="mt-2">
                  <UnitDialog unit={null} />
                </div>
              )}
            </div>
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}
