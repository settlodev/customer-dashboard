import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/supplier/columns";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import {
  fetchAllSuppliers,
  fetchSettloSuppliers,
} from "@/lib/actions/supplier-actions";
import { Supplier, SettloSupplier } from "@/types/supplier/type";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Suppliers", link: "/suppliers" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

function mapSettloToSupplier(s: SettloSupplier): Supplier {
  return {
    id: s.id,
    businessId: "",
    name: s.name,
    contactPersonName: s.contactPerson || "",
    contactPersonPhone: s.phone || "",
    phone: s.phone,
    email: s.email,
    address: s.address,
    registrationNumber: s.registrationNumber,
    tinNumber: s.tinNumber,
    settloSupplierId: null,
    settloSupplierName: null,
    linkedToSettloSupplier: false,
    archivedAt: null,
    isSettloSupplier: true,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit) || 10;

  const [userSuppliers, settloSuppliers] = await Promise.all([
    fetchAllSuppliers(),
    fetchSettloSuppliers(),
  ]);

  // Map and tag each source
  const taggedUser: Supplier[] = userSuppliers.map((s) => ({
    ...s,
    isSettloSupplier: false,
  }));
  const taggedSettlo: Supplier[] = settloSuppliers.map(mapSettloToSupplier);

  // Merge: Settlo first, then user suppliers, sorted by name within each group
  const all = [
    ...taggedSettlo.sort((a, b) => a.name.localeCompare(b.name)),
    ...taggedUser.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  // Server-side search filter
  const filtered = q
    ? all.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : all;

  // Server-side pagination
  const pageIndex = page > 0 ? page - 1 : 0;
  const start = pageIndex * pageLimit;
  const data = filtered.slice(start, start + pageLimit);
  const total = filtered.length;
  const pageCount = Math.ceil(total / pageLimit);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Supplier
            </Link>
          </Button>
        </div>
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
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName="suppliers" newItemUrl="/suppliers/new" />
      )}
    </div>
  );
}
