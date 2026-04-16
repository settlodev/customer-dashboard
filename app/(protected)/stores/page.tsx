import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/store/column";
import { fetchAllStores } from "@/lib/actions/store-actions";
import { getCurrentSubscription, getPendingInvoice } from "@/lib/actions/billing-actions";
import { Plus } from "lucide-react";
import type { Store } from "@/types/store/type";

export type EnrichedStore = Store & {
  subscriptionActive: boolean;
  hasPendingInvoice: boolean;
};

const breadcrumbItems = [{ title: "Stores", link: "/stores" }];

export default async function Page() {
  const [stores, subscription] = await Promise.all([
    fetchAllStores(),
    getCurrentSubscription(),
  ]);

  // Check for pending invoice on the subscription
  let hasPendingInvoice = false;
  if (subscription) {
    const pending = await getPendingInvoice(subscription.id);
    hasPendingInvoice = !!pending;
  }

  // Build a set of store IDs that have active subscription items
  const activeStoreIds = new Set(
    subscription?.items
      ?.filter((item) => item.entityType === "STORE" && item.status === "ACTIVE")
      .map((item) => item.entityId) ?? [],
  );

  // Enrich stores with subscription status
  const enrichedStores: EnrichedStore[] = stores.map((store) => ({
    ...store,
    subscriptionActive: activeStoreIds.has(store.id),
    hasPendingInvoice: activeStoreIds.has(store.id) && hasPendingInvoice,
  }));

  const total = enrichedStores.length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stores/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Store
          </Link>
        </Button>
      </div>

      {total > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable columns={columns} data={enrichedStores} searchKey="name" pageNo={0} total={total} pageCount={1} />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stores/new" itemName="stores" />
      )}
    </div>
  );
}
