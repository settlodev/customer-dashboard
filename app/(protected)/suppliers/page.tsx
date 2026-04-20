import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/supplier/columns";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";

const breadcrumbItems = [{ title: "Suppliers", link: "/suppliers" }];

type Props = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    filter?: "active" | "archived" | "all";
  }>;
};

export default async function SuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = params.filter ?? "active";
  const q = (params.search ?? "").trim().toLowerCase();
  const page = Number(params.page) || 0;
  const pageLimit = Number(params.limit) || 25;

  const all = await fetchAllSuppliers();

  const active = all.filter((s) => !s.archivedAt);
  const archived = all.filter((s) => !!s.archivedAt);

  const scope =
    filter === "archived" ? archived : filter === "all" ? all : active;

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

  const tabs = [
    { key: "active", label: "Active", count: active.length },
    { key: "archived", label: "Archived", count: archived.length },
    { key: "all", label: "All", count: all.length },
  ] as const;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add supplier
          </Link>
        </Button>
      </div>

      <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg">
        {tabs.map((t) => {
          const href =
            t.key === "active"
              ? "/suppliers"
              : `/suppliers?filter=${t.key}`;
          const isActive = filter === t.key;
          return (
            <Link
              key={t.key}
              href={href}
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

      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageNo={page}
              searchKey="name"
              total={total}
              rowClickBasePath="/suppliers"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName="suppliers" newItemUrl="/suppliers/new" />
      )}
    </div>
  );
}
