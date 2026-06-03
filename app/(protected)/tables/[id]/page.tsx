import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Space, TABLE_SPACE_TYPE_LABELS } from "@/types/space/type";
import { getTable, getSpace } from "@/lib/actions/space-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { listOrders } from "@/lib/actions/order-actions";
import { OrderStatus } from "@/types/orders/type";
import { SpaceDetailView } from "@/app/(protected)/spaces/[id]/space-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string }>;

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  if (id === "new") redirect("/tables/new");

  let space: Space | null = null;
  let redirectTo: string | null = null;
  try {
    space = await getTable(id as UUID);
  } catch {
    try {
      const asSpace = await getSpace(id as UUID);
      redirectTo = `/spaces/${asSpace.id}`;
    } catch {
      /* fall through to notFound */
    }
  }
  if (redirectTo) redirect(redirectTo);
  if (!space) notFound();

  // Per-table sales for the Sales tab — last 30 days of closed orders at
  // this table. No per-table orders endpoint exists, so pull the location's
  // recent closed orders and filter by tableId.
  const currency = await getLocationCurrency().catch(() => "TZS");
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate30 = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];
  const allOrders = await listOrders({
    fromDate: fromDate30,
    toDate,
    status: OrderStatus.CLOSED,
  }).catch(() => []);
  const salesOrders = allOrders.filter(
    (o) => String(o.tableId) === String(space.id),
  );

  const statusLabel = space.active ? "Active" : "Inactive";
  const statusClass = space.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const subtitleParts: string[] = [];
  subtitleParts.push(
    TABLE_SPACE_TYPE_LABELS[space.type] ?? String(space.type),
  );
  subtitleParts.push(
    space.minCapacity != null
      ? `${space.minCapacity}–${space.capacity} seats`
      : `${space.capacity} seats`,
  );
  if (space.parentSpaceName) subtitleParts.push(space.parentSpaceName);
  if (space.floorPlanName) subtitleParts.push(space.floorPlanName);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Tables", href: "/tables" },
          { title: space.name },
        ]}
      />
      <PageHeader
        title={space.name}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {space.code && (
              <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {space.code}
              </span>
            )}
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/tables/${space.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <SpaceDetailView
          space={space}
          salesOrders={salesOrders}
          currency={currency}
          initialTab={tab}
        />
      </PageBody>
    </PageShell>
  );
}
