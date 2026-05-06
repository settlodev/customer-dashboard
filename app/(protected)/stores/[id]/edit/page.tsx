import { notFound, redirect } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StoreForm from "@/components/forms/store_form";
import { getStore } from "@/lib/actions/store-actions";
import { Store } from "@/types/store/type";

type Params = Promise<{ id: string }>;

export default async function StoreEditPage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") redirect("/stores/new");

  let store: Store | null = null;
  try {
    store = await getStore(id);
    if (!store) notFound();
  } catch {
    notFound();
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stores", href: "/stores" },
          { title: store.name, href: `/stores/${store.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${store.name}`}
        subtitle="Update store profile, address, and operating settings."
      />
      <PageBody>
        <StoreForm item={store} />
      </PageBody>
    </PageShell>
  );
}
