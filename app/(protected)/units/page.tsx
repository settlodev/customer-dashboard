import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/units/column";
import { UnitDialog } from "@/components/widgets/unit/unit-dialog";
import { getUnits } from "@/lib/actions/unit-actions";
import type { UnitOfMeasure } from "@/types/unit/type";

const breadcrumbItems = [{ title: "Units", link: "/units" }];

type Props = {
  searchParams: Promise<{ filter?: "active" | "archived" | "system" | "all" }>;
};

export default async function UnitsPage({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;
  const all: UnitOfMeasure[] = await getUnits();

  const mine = all.filter((u) => !u.systemGenerated);
  const system = all.filter((u) => u.systemGenerated);
  const active = mine.filter((u) => !u.archivedAt);
  const archived = mine.filter((u) => !!u.archivedAt);

  const scope =
    filter === "archived"
      ? archived
      : filter === "system"
        ? system
        : filter === "all"
          ? all
          : active;

  const data = [...scope].sort((a, b) => a.name.localeCompare(b.name));

  const tabs = [
    { key: "active", label: "My units", count: active.length, href: "/units" },
    {
      key: "archived",
      label: "Archived",
      count: archived.length,
      href: "/units?filter=archived",
    },
    {
      key: "system",
      label: "System",
      count: system.length,
      href: "/units?filter=system",
    },
    { key: "all", label: "All", count: all.length, href: "/units?filter=all" },
  ] as const;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BreadcrumbsNav items={breadcrumbItems} />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-2">
            Units of measure
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create custom units for your business. System units are read-only
            and shared across the platform.
          </p>
        </div>
        <UnitDialog unit={null} />
      </div>

      <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg flex-wrap">
        {tabs.map((t) => {
          const isActive = filter === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-background shadow-sm font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">{t.count}</span>
            </Link>
          );
        })}
      </div>

      {data.length > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="name"
              pageNo={0}
              total={data.length}
              pageCount={1}
              rowClickBasePath="/units"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="h-[calc(100vh-320px)] border border-dashed rounded-xl">
          <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
            <h2 className="text-lg font-semibold">No units in this view</h2>
            {filter !== "system" && (
              <p className="text-sm text-muted-foreground">
                Add a custom unit to get started.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
