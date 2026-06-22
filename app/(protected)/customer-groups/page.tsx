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
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";
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
    softFetch(fetchCustomerGroups({ includeInactive: true })),
    softFetch(searchCustomerGroups(q, page, pageLimit)),
  ]);

  const loadFailed = !allGroups || !responseData;

  const groups = allGroups ?? [];
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.active).length;
  const inactiveGroups = totalGroups - activeGroups;
  const totalMembers = groups.reduce(
    (sum, g) => sum + (g.customerCount || 0),
    0,
  );

  const data: CustomerGroup[] = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

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
        {loadFailed ? (
          <DataLoadError itemName="customer groups" />
        ) : hasAnyGroup || q !== "" ? (
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
