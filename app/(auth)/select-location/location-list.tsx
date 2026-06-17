"use client";

import * as Sentry from "@sentry/nextjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Loader2Icon,
  ChevronRight,
  Warehouse,
  Store as StoreIcon,
} from "lucide-react";
import { Location } from "@/types/location/type";
import { Store } from "@/types/store/type";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { clearBusiness } from "@/lib/actions/business/refresh";
import {
  switchToLocation,
  switchToStore,
  switchToWarehouse,
} from "@/lib/actions/destination";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type DestKind = "location" | "warehouse" | "store";

// Common shape across the three destination types — every entity carries
// id / name / active, plus a few optional fields used for the subtitle line.
type DestItem = {
  id: string;
  name: string;
  active?: boolean;
  address?: string;
  region?: string;
  district?: string;
  code?: string;
  description?: string;
};

const TAB_META: Record<
  DestKind,
  { label: string; singular: string; Icon: typeof MapPin }
> = {
  location: { label: "Locations", singular: "location", Icon: MapPin },
  warehouse: { label: "Warehouses", singular: "warehouse", Icon: Warehouse },
  store: { label: "Stores", singular: "store", Icon: StoreIcon },
};

const LocationList = ({
  locations,
  businessName,
  warehouses,
  stores,
}: {
  locations: Location[];
  businessName: string;
  warehouses: Warehouses[];
  stores: Store[];
}) => {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const autoSelectRan = useRef(false);

  // Only show a tab for a destination type that actually exists. Locations
  // are always present (the page redirects to /business-location otherwise);
  // warehouses and stores appear only when the business has any.
  const tabs = useMemo<DestKind[]>(() => {
    const t: DestKind[] = ["location"];
    if (warehouses.length > 0) t.push("warehouse");
    if (stores.length > 0) t.push("store");
    return t;
  }, [warehouses.length, stores.length]);

  const [activeTab, setActiveTab] = useState<DestKind>("location");

  const displayedItems = useMemo<DestItem[]>(() => {
    if (activeTab === "warehouse") return warehouses as DestItem[];
    if (activeTab === "store") return stores as DestItem[];
    return locations as DestItem[];
  }, [activeTab, locations, warehouses, stores]);

  const handleSelect = async (item: DestItem, index: number, kind: DestKind) => {
    if (isRedirecting || pendingIndex !== null) return;
    setPendingIndex(index);
    setIsRedirecting(true);

    try {
      // Routing mirrors the in-app destination switcher
      // (components/navigation/location-switcher.tsx): active destinations
      // go to their landing page and the per-destination subscription claim
      // is enforced downstream by middleware; an inactive one is bounced to
      // the right recovery flow.
      if (kind === "warehouse") {
        await switchToWarehouse(item as unknown as Warehouses);
        window.location.href = item.active ? "/warehouse" : "/select-location";
      } else if (kind === "store") {
        await switchToStore(item as unknown as Store);
        window.location.href = item.active ? "/dashboard" : "/select-location";
      } else {
        await switchToLocation(item as unknown as Location);
        window.location.href = item.active
          ? "/dashboard"
          : `/subscription?location=${item.id}`;
      }
    } catch (error) {
      Sentry.captureException(error);
      setIsRedirecting(false);
      setPendingIndex(null);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn't open that destination. Please try again.",
      });
    }
  };

  // Auto-select when there is exactly one destination overall — a single
  // location and nothing else. Runs once on mount.
  useEffect(() => {
    if (
      locations.length === 1 &&
      warehouses.length === 0 &&
      stores.length === 0 &&
      !autoSelectRan.current
    ) {
      autoSelectRan.current = true;
      handleSelect(locations[0] as DestItem, 0, "location");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getSubtitle = (item: DestItem, kind: DestKind): string | null => {
    if (kind === "warehouse") {
      if (item.code) return `Code · ${item.code}`;
      return item.description || null;
    }
    return (
      item.address ||
      [item.region, item.district].filter(Boolean).join(", ") ||
      null
    );
  };

  return (
    <section className="relative">
      <div className="relative w-full max-w-md mx-auto">
        {isRedirecting && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-30 rounded-xl flex items-center justify-center flex-col gap-3">
            <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-primary font-medium">Redirecting...</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {businessName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a {TAB_META[activeTab].singular} to continue
          </p>
        </div>

        {/* Tabs — only rendered when more than one destination type exists */}
        {tabs.length > 1 && (
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
            {tabs.map((kind) => {
              const { label, Icon } = TAB_META[kind];
              return (
                <button
                  key={kind}
                  onClick={() => setActiveTab(kind)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    activeTab === kind
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                {React.createElement(TAB_META[activeTab].Icon, {
                  className: "w-6 h-6 text-gray-400",
                })}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No {TAB_META[activeTab].label.toLowerCase()} found
              </p>
            </div>
          ) : (
            displayedItems.map((item, index) => {
              const subtitle = getSubtitle(item, activeTab);
              const isWarehouse = activeTab === "warehouse";
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item, index, activeTab)}
                  disabled={pendingIndex === index || isRedirecting}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                    pendingIndex === index
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      isWarehouse ? "bg-blue-50 dark:bg-blue-900/20" : "bg-primary/10",
                    )}
                  >
                    {React.createElement(TAB_META[activeTab].Icon, {
                      className: cn(
                        "w-5 h-5",
                        isWarehouse
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-primary",
                      ),
                    })}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                      {item.active === false && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    {subtitle && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {!isWarehouse && <MapPin className="w-3 h-3" />}
                        <span className="truncate">{subtitle}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {pendingIndex === index ? (
                      <Loader2Icon className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Switch business */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              setIsRedirecting(true);
              await clearBusiness();
              window.location.href = "/select-business";
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Switch business
          </button>
        </div>
      </div>
    </section>
  );
};

export default LocationList;
