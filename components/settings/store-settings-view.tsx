"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import Loading from "@/components/ui/loading";
import { storeSettingsNavItems } from "@/types/constants";
import { SettingsNavShell } from "./shared/settings-nav-shell";

import { getStoreSettings } from "@/lib/actions/store-settings-actions";
import { getStore } from "@/lib/actions/store-actions";
import type { Store, StoreSettings } from "@/types/store/type";

import { StoreProfilePanel } from "./panels/store/store-profile-panel";
import { StoreInventoryPanel } from "./panels/store/store-inventory-panel";
import { StoreTransfersPanel } from "./panels/store/store-transfers-panel";
import { StoreReceivingPanel } from "./panels/store/store-receiving-panel";
import { StoreTrackingPanel } from "./panels/store/store-tracking-panel";
import { StoreCountingPanel } from "./panels/store/store-counting-panel";

type StoreTabId =
  | "store"
  | "store-inventory"
  | "store-transfers"
  | "store-receiving"
  | "store-tracking"
  | "store-counting";

/**
 * Settings for the active STORE. A store is a stockroom hanging off a
 * location — it never sells, and business- / location-level configuration is
 * not its to change, so this view deliberately shows neither. It is rendered
 * in place of the location settings page whenever a store is the active
 * destination.
 */
export function StoreSettingsView({
  store: initialStore,
  initialTab,
}: {
  store: Store;
  initialTab?: string;
}) {
  const [store, setStore] = useState<Store>(initialStore);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StoreTabId>(
    storeSettingsNavItems.some((i) => i.id === initialTab)
      ? (initialTab as StoreTabId)
      : "store",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The cookie copy of the store is a snapshot from selection time; refetch
      // so the profile panel edits current values.
      const [fresh, loaded] = await Promise.all([
        getStore(initialStore.id).catch(() => null),
        getStoreSettings(initialStore.id),
      ]);
      if (cancelled) return;
      if (fresh) setStore(fresh);
      setSettings(loaded);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialStore.id]);

  const content = () => {
    if (activeTab === "store") {
      return <StoreProfilePanel store={store} onSaved={setStore} />;
    }
    if (isLoading) {
      return (
        <div className="py-16 flex items-center justify-center">
          <Loading />
        </div>
      );
    }
    if (!settings) {
      return <EmptyState label="Store settings unavailable" />;
    }

    const shared = {
      settings,
      storeId: store.id,
      onSaved: setSettings,
    };

    switch (activeTab) {
      case "store-inventory":
        return <StoreInventoryPanel {...shared} />;
      case "store-transfers":
        return <StoreTransfersPanel {...shared} />;
      case "store-receiving":
        return <StoreReceivingPanel {...shared} />;
      case "store-tracking":
        return <StoreTrackingPanel {...shared} />;
      case "store-counting":
        return <StoreCountingPanel {...shared} />;
      default:
        return <StoreProfilePanel store={store} onSaved={setStore} />;
    }
  };

  return (
    <>
      <PageBreadcrumbs items={[{ title: "Settings" }]} />
      <PageHeader
        title="Store settings"
        subtitle={`Configuring ${store.name}`}
      />
      <PageBody>
        <SettingsNavShell
          items={storeSettingsNavItems}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as StoreTabId)}
        >
          {content()}
        </SettingsNavShell>
      </PageBody>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground italic">
        {label}
      </CardContent>
    </Card>
  );
}
