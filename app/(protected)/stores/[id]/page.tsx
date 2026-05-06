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
import { getStore } from "@/lib/actions/store-actions";
import { Store } from "@/types/store/type";
import { StoreDetailView } from "./store-detail-view";

type Params = Promise<{ id: string }>;

export default async function StorePage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") redirect("/stores/new");

  let store: Store | null = null;
  try {
    store = await getStore(id);
    if (!store) notFound();
  } catch {
    notFound();
  }

  const statusLabel = store.active ? "Active" : "Inactive";
  const statusClass = store.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const subtitleParts: string[] = [];
  if (store.storeType) subtitleParts.push(store.storeType);
  if (store.region) subtitleParts.push(store.region);
  if (store.district) subtitleParts.push(store.district);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stores", href: "/stores" },
          { title: store.name },
        ]}
      />
      <PageHeader
        title={store.name}
        titleAccessory={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {store.identifier && (
              <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {store.identifier}
              </span>
            )}
          </span>
        }
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/stores/${store.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StoreDetailView store={store} />
      </PageBody>
    </PageShell>
  );
}
