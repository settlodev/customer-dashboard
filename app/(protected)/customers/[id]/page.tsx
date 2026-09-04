import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { UUID } from "node:crypto";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import {
  fetchCustomerPreferences,
  getCustomerById,
} from "@/lib/actions/customer-actions";
import {
  getCustomerInsights,
  getCustomerPurchaseSummary,
} from "@/lib/actions/customer-analytics-actions";
import { getCustomerArBalance } from "@/lib/actions/customer-ar-actions";
import {
  listCustomerArInvoices,
  listCustomerSignedBills,
} from "@/lib/actions/customer-ar-invoice-actions";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { ordersSummary, searchOrders } from "@/lib/actions/order-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import {
  customerOrderBucketQuery,
  parseCustomerOrderBucket,
} from "@/lib/orders/customer-order-buckets";
import { resolveOrderRowNames } from "@/lib/orders/order-list-view";
import type { CustomerArBalance } from "@/types/customer-ar/type";
import type {
  CustomerArInvoiceSummary,
  CustomerSignedBill,
} from "@/types/customer-ar-invoice/type";
import type { Customer, CustomerPreference } from "@/types/customer/type";

import {
  CustomerDetailView,
  parseCustomerTab,
} from "./customer-detail-view";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    bucket?: string;
    page?: string;
    limit?: string;
    search?: string;
  }>;
};

export default async function CustomerPage({ params, searchParams }: Params) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  if (id === "new") redirect("/customers/new");

  let customer: Customer | null = null;
  let preferences: CustomerPreference[] = [];

  try {
    const customerId = id as UUID;
    const [c, prefs] = await Promise.all([
      getCustomerById(customerId),
      fetchCustomerPreferences(customerId).catch(() => []),
    ]);
    customer = c;
    preferences = prefs ?? [];
  } catch {
    throw new Error("Failed to load customer details");
  }

  if (!customer) notFound();

  // The order ledger is URL-driven exactly like the Orders page: the OMS
  // does the bucket filter, search, and paging, and — because it is one
  // customer's ledger — runs it over all time rather than this month.
  const tab = parseCustomerTab(sp.tab);
  const bucket = parseCustomerOrderBucket(sp.bucket);
  const page = Number(sp.page) || 1;
  const limit = Number(sp.limit) || 10;
  const q = sp.search ?? "";

  // Every read fans out at once; each fails soft to an empty state so one
  // slow or unreachable service never takes the whole page down.
  const [
    arBalance,
    signedBills,
    arInvoices,
    purchase,
    insights,
    ordersPage,
    ledger,
    staffList,
    tablesList,
    currency,
    locationSettings,
    currentLocation,
  ] = await Promise.all([
    getCustomerArBalance(customer.id, customer.locationId) as Promise<CustomerArBalance | null>,
    listCustomerSignedBills(customer.id, customer.locationId) as Promise<CustomerSignedBill[]>,
    listCustomerArInvoices(customer.id) as Promise<CustomerArInvoiceSummary[]>,
    getCustomerPurchaseSummary(customer.id),
    getCustomerInsights(customer.id, customer.locationId),
    searchOrders({
      customerId: customer.id,
      ...customerOrderBucketQuery(bucket),
      excludeAbandoned: true,
      search: q || undefined,
      page,
      limit,
    }),
    ordersSummary({ customerId: customer.id, excludeAbandoned: true }),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
    getLocationCurrency().catch(() => "TZS"),
    getLocationSettings().catch(() => null),
    getCurrentLocation(),
  ]);

  const rows = ordersPage.content ?? [];
  const { staffNames, tableNames } = resolveOrderRowNames(
    rows,
    staffList,
    tablesList,
  );
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  const fullName =
    customer.fullName?.trim() ||
    `${customer.firstName} ${customer.lastName}`.trim();

  // Subtitle reads "Phone · Email · Group" — collapses dividers when any
  // segment is missing so we don't end up with stray bullets.
  const subtitleParts: string[] = [];
  if (customer.phoneNumber) subtitleParts.push(customer.phoneNumber);
  if (customer.email) subtitleParts.push(customer.email);
  if (customer.customerGroupName) subtitleParts.push(customer.customerGroupName);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Customers", href: "/customers" },
          { title: fullName },
        ]}
      />
      <PageHeader
        title={fullName}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <Badge variant={customer.active ? "pos" : "soft"}>
              {customer.active ? "Active" : "Inactive"}
            </Badge>
            {customer.customerAccountNumber && (
              <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {customer.customerAccountNumber}
              </span>
            )}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/customers/${customer.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />
      {currentLocation?.id && (
        <OrdersRealtimeBridge locationId={currentLocation.id} />
      )}

      <PageBody>
        <CustomerDetailView
          customer={customer}
          preferences={preferences}
          arBalance={arBalance}
          signedBills={signedBills}
          arInvoices={arInvoices}
          purchase={purchase}
          ledger={ledger}
          insights={insights}
          orders={{
            rows,
            pageCount: ordersPage.totalPages ?? 0,
            pageNo: page - 1,
            total: ordersPage.totalElements ?? 0,
            bucket,
            searching: q !== "",
          }}
          tableMode={tableMode}
          staffNames={staffNames}
          tableNames={tableNames}
          currency={currency}
          tab={tab}
          preservedParams={{
            tab: sp.tab,
            limit: sp.limit,
            search: sp.search,
          }}
        />
      </PageBody>
    </PageShell>
  );
}
