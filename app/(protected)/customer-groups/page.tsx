import { ToggleLeft, Users, UsersRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/customer-group/column";
import {
  fetchCustomerGroups,
  searchCustomerGroups,
} from "@/lib/actions/customer-actions";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { AddGroupButton } from "@/components/widgets/customer-group/add-group-button";
import { CustomerGroup } from "@/types/customer/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function CustomerGroupsPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit);

  const [allGroups, responseData] = await Promise.all([
    fetchCustomerGroups({ includeInactive: true }).catch(
      () => [] as CustomerGroup[],
    ),
    searchCustomerGroups(q, page, pageLimit).catch(() => ({
      content: [] as CustomerGroup[],
      totalElements: 0,
      totalPages: 0,
      size: 0,
      number: 0,
    })),
  ]);

  const totalGroups = allGroups.length;
  const activeGroups = allGroups.filter((g) => g.active).length;
  const inactiveGroups = totalGroups - activeGroups;
  const totalMembers = allGroups.reduce(
    (sum, g) => sum + (g.customerCount || 0),
    0,
  );

  const data: CustomerGroup[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  const hasAnyGroup = totalGroups > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Customer groups" }]} />
      <PageHeader
        title="Customer groups"
        subtitle="Organize and segment your customers into groups like VIPs, Corporate, or Regulars."
        actions={<AddGroupButton />}
      />

      <PageBody>
        {hasAnyGroup || q !== "" ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<UsersRound className="h-3 w-3" />}
                label="Total groups"
                value={totalGroups.toLocaleString()}
              />
              <KpiCard
                icon={<UsersRound className="h-3 w-3" />}
                label="Active"
                value={activeGroups.toLocaleString()}
                deltaTone="pos"
              />
              <KpiCard
                icon={<ToggleLeft className="h-3 w-3" />}
                label="Inactive"
                value={
                  inactiveGroups > 0 ? inactiveGroups.toLocaleString() : "—"
                }
                deltaTone={inactiveGroups > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Members"
                value={totalMembers > 0 ? totalMembers.toLocaleString() : "—"}
                delta={totalMembers > 0 ? "Across all groups" : undefined}
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  pageNo={page}
                  searchKey="name"
                  total={total}
                  disableArchive
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="customer groups" cta={<AddGroupButton />} />
        )}
      </PageBody>
    </PageShell>
  );
}
