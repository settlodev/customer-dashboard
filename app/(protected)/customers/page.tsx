import Link from "next/link";
import {
  CreditCard,
  Plus,
  Star,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/customer/column";
import {
  getCustomerCount,
  getCustomerSummaryStats,
  searchCustomer,
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
import { CustomerStatusTabs } from "@/components/tables/customer/status-tabs";
import { Customer } from "@/types/customer/type";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import {
  getOutstandingPrepaidLiability,
  getTopCustomerPrepaidBalances,
} from "@/lib/actions/prepayment-analytics-actions";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search?.trim() ?? "";
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit);
  const status: "active" | "inactive" | "all" =
    resolved.status === "inactive"
      ? "inactive"
      : resolved.status === "all"
        ? "all"
        : "active";

  const activeFilter = status === "all" ? undefined : status === "active";

  // Counts and summary stats roll up from the full list — so the KPI
  // strip and status tabs stay accurate regardless of which tab the
  // current page is showing. Folded into the same Promise.all as the
  // paged search so all three fetches happen in parallel instead of
  // counts+stats finishing before the search even starts.
  const business = await getCurrentBusiness();
  const [counts, stats, responseData, prepaid, topBalances] =
    await Promise.all([
      getCustomerCount().catch(() => ({ total: 0, active: 0, inactive: 0 })),
      getCustomerSummaryStats().catch(() => ({
        loyaltyPointsTotal: 0,
        creditLimitCount: 0,
        withEmail: 0,
        noShowCustomers: 0,
      })),
      softFetch(searchCustomer(q, page, pageLimit, activeFilter)),
      business?.id
        ? getOutstandingPrepaidLiability(business.id)
        : Promise.resolve(null),
      business?.id
        ? getTopCustomerPrepaidBalances(business.id, 500)
        : Promise.resolve([]),
    ]);

  // Per-customer prepaid balance map (business-wide) → enrich the visible rows
  // so the table can show a Prepaid column without an N+1 per-row fetch.
  const prepaidByCustomer = new Map(
    topBalances.map((b) => [b.customerId, b.outstandingBalance]),
  );
  const data: Customer[] = (responseData?.content ?? []).map((c) => ({
    ...c,
    prepaidBalance: prepaidByCustomer.get(c.id),
  }));
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const hasAnyCustomer = counts.total > 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Customers" }]} />
      <PageHeader
        title="Customers"
        subtitle="People who buy from this location — track loyalty, credit, and contact details."
        actions={
          <Button asChild size="sm">
            <Link href="/customers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add customer
            </Link>
          </Button>
        }
      />

      <PageBody>
        {hasAnyCustomer || q !== "" ? (
          <>
            <KpiStrip cols={6}>
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Total"
                value={counts.total.toLocaleString()}
              />
              <KpiCard
                icon={<UserCheck className="h-3 w-3" />}
                label="Active"
                value={counts.active.toLocaleString()}
                deltaTone="pos"
              />
              <KpiCard
                icon={<UserX className="h-3 w-3" />}
                label="Inactive"
                value={
                  counts.inactive > 0 ? counts.inactive.toLocaleString() : "—"
                }
                deltaTone={counts.inactive > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<Star className="h-3 w-3" />}
                label="Loyalty pts"
                value={
                  stats.loyaltyPointsTotal > 0
                    ? stats.loyaltyPointsTotal.toLocaleString()
                    : "—"
                }
                delta={
                  stats.loyaltyPointsTotal > 0 ? "Across all" : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CreditCard className="h-3 w-3" />}
                label="On credit"
                value={
                  stats.creditLimitCount > 0
                    ? stats.creditLimitCount.toLocaleString()
                    : "—"
                }
                delta={
                  stats.noShowCustomers > 0
                    ? `${stats.noShowCustomers} no-show`
                    : undefined
                }
                deltaTone={stats.noShowCustomers > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Prepaid owed"
                value={
                  prepaid && prepaid.outstandingLiability > 0
                    ? prepaid.outstandingLiability.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })
                    : "—"
                }
                unit={
                  prepaid && prepaid.outstandingLiability > 0 ? "TZS" : undefined
                }
                delta="Business-wide"
                deltaTone={
                  prepaid && prepaid.outstandingLiability > 0 ? "neg" : "neutral"
                }
              />
            </KpiStrip>

            <CustomerStatusTabs
              value={status}
              counts={{
                active: counts.active,
                inactive: counts.inactive,
                all: counts.total,
              }}
            />

            {!responseData ? (
              <DataLoadError itemName="customers" />
            ) : (
              <Card>
                <CardContent className="px-2 pt-6 sm:px-6">
                  <DataTable
                    columns={columns}
                    data={data}
                    pageCount={pageCount}
                    pageNo={page}
                    searchKey="firstName"
                    total={total}
                    rowClickBasePath="/customers"
                  />
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <NoItems itemName="customers" newItemUrl="/customers/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
