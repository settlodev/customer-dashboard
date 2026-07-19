import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getWarehouse } from "@/lib/actions/warehouse/list-warehouse";
import WarehouseForm from "@/components/forms/warehouse_form";
import EntitySubscriptionSetup from "@/components/subscription/EntitySubscriptionSetup";
import { getEntityEntitlements } from "@/lib/actions/entitlement-actions";
import { EntityLockedNotice } from "@/components/subscription/EntityLockedNotice";

type Params = Promise<{ id: string }>;
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getWarehouse(id);
  if (!item) notFound();

  // Per-entity gate: a warehouse's operational view is locked once its OWN subscription lapses
  // (EXPIRED/SUSPENDED/CANCELLED). Its trial is usable. Permissive when the entity is unknown
  // (provisioning lag / billing not configured). The subscription section stays visible to renew.
  const entitlement = await getEntityEntitlements(item.id);
  const warehouseLocked = entitlement != null && !entitlement.active;
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 mt-12">
      <BreadcrumbsNav items={[{ title: "Warehouse Profile", link: "/warehouse-profile" }]} />
      <h1 className="text-2xl font-bold mt-4">{item.name}</h1>
      <p className="text-sm text-muted-foreground">{item.identifier} · {item.active ? "Active" : "Inactive"}</p>

      <div className="mt-4">
        <EntitySubscriptionSetup
          entityType="WAREHOUSE"
          entityId={item.id}
          entityName={item.name}
          businessId={item.businessId}
          locationId={item.id}
        />
      </div>

      <div className="mt-6">
        {warehouseLocked ? (
          <EntityLockedNotice entityType="WAREHOUSE" reason="expired" />
        ) : (
          <WarehouseForm item={item} />
        )}
      </div>
    </div>
  );
}
