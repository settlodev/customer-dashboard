import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStore } from "@/lib/actions/store-actions";
import StoreForm from "@/components/forms/store_form";
import StoreSubscriptionSetup from "@/components/subscription/StoreSubscriptionSetup";

type Params = Promise<{ id: string }>;

export default async function StorePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item = null;

  if (!isNewItem) {
    try {
      item = await getStore(resolvedParams.id);
      if (!item) notFound();
    } catch {
      notFound();
    }
  }

  const breadcrumbItems = [
    { title: "Stores", link: "/stores" },
    { title: isNewItem ? "New" : item?.name || "Edit", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Store" : item?.name || "Edit Store"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Create a new store for your business"
              : "Manage store details and subscription"}
          </p>
        </div>

        {/* Show pending invoice / subscription setup for existing stores */}
        {!isNewItem && item && (
          <StoreSubscriptionSetup
            storeId={item.id}
            storeName={item.name}
            businessId={item.businessId}
            locationId={item.locationId}
          />
        )}

        <StoreForm item={isNewItem ? null : item} />
      </div>
    </div>
  );
}
