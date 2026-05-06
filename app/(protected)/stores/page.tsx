import Link from "next/link";
import {
  Store as StoreIcon,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Clock,
  PowerOff,
} from "lucide-react";

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
import { columns } from "@/components/tables/store/column";
import { fetchAllStores } from "@/lib/actions/store-actions";
import {
  getCurrentSubscription,
  getPendingInvoice,
} from "@/lib/actions/billing-actions";
import type { Store } from "@/types/store/type";

export type EnrichedStore = Store & {
  subscriptionActive: boolean;
  hasPendingInvoice: boolean;
};

export default async function Page() {
  const [stores, subscription] = await Promise.all([
    fetchAllStores(),
    getCurrentSubscription().catch(() => null),
  ]);

  let hasPendingInvoice = false;
  if (subscription) {
    const pending = await getPendingInvoice(subscription.id).catch(() => null);
    hasPendingInvoice = !!pending;
  }

  const activeStoreIds = new Set(
    subscription?.items
      ?.filter(
        (item) => item.entityType === "STORE" && item.status === "ACTIVE",
      )
      .map((item) => item.entityId) ?? [],
  );

  const enrichedStores: EnrichedStore[] = stores.map((store) => ({
    ...store,
    subscriptionActive: activeStoreIds.has(store.id),
    hasPendingInvoice: activeStoreIds.has(store.id) && hasPendingInvoice,
  }));

  const total = enrichedStores.length;
  const activeCount = enrichedStores.filter(
    (s) => s.active && s.subscriptionActive,
  ).length;
  const pendingActivation = enrichedStores.filter(
    (s) => !s.subscriptionActive,
  ).length;
  const paymentDue = enrichedStores.filter((s) => s.hasPendingInvoice).length;
  const inactiveCount = enrichedStores.filter((s) => !s.active).length;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stores" }]} />
      <PageHeader
        title="Stores"
        subtitle="Online and physical storefronts associated with this location."
        actions={
          <Button asChild size="sm">
            <Link href="/stores/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add store
            </Link>
          </Button>
        }
      />

      <PageBody>
        {total > 0 ? (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<StoreIcon className="h-3 w-3" />}
                label="Total"
                value={total.toLocaleString()}
              />
              <KpiCard
                icon={<CheckCircle2 className="h-3 w-3" />}
                label="Active"
                value={activeCount.toLocaleString()}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Clock className="h-3 w-3" />}
                label="Pending activation"
                value={
                  pendingActivation > 0
                    ? pendingActivation.toLocaleString()
                    : "—"
                }
                deltaTone={pendingActivation > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<AlertTriangle className="h-3 w-3" />}
                label="Payment due"
                value={paymentDue > 0 ? paymentDue.toLocaleString() : "—"}
                deltaTone={paymentDue > 0 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<PowerOff className="h-3 w-3" />}
                label="Inactive"
                value={inactiveCount > 0 ? inactiveCount.toLocaleString() : "—"}
                deltaTone={inactiveCount > 0 ? "neg" : "neutral"}
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={enrichedStores}
                  searchKey="name"
                  pageNo={0}
                  total={total}
                  pageCount={1}
                  rowClickBasePath="/stores"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems newItemUrl="/stores/new" itemName="stores" />
        )}
      </PageBody>
    </PageShell>
  );
}
