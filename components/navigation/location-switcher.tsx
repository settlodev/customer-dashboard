"use client";

import * as Sentry from "@sentry/nextjs";
import {
  ChevronDown,
  MapPin,
  Store as StoreIcon,
  Warehouse,
  Loader2,
  Check,
} from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import type { Location } from "@/types/location/type";
import type { Store } from "@/types/store/type";
import type { Warehouses } from "@/types/warehouse/warehouse/type";
import {
  switchToLocation,
  switchToStore,
  switchToWarehouse,
} from "@/lib/actions/destination";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DestinationKind = "location" | "store" | "warehouse";

type Destination =
  | { kind: "location"; data: Location }
  | { kind: "store"; data: Store }
  | { kind: "warehouse"; data: Warehouses };

interface LocationSwitcherProps {
  locationList?: Location[] | null;
  currentLocation?: Location;
  storeList?: Store[];
  currentStore?: Store;
  warehouseList?: Warehouses[];
  warehouse?: Warehouses;
}

const KIND_META: Record<
  DestinationKind,
  { label: string; icon: typeof MapPin }
> = {
  location: { label: "Location", icon: MapPin },
  store: { label: "Store", icon: StoreIcon },
  warehouse: { label: "Warehouse", icon: Warehouse },
};

export const LocationSwitcher = ({
  locationList,
  currentLocation,
  storeList,
  currentStore,
  warehouseList,
  warehouse,
}: LocationSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Destination | null>(null);

  // Active destination: warehouse → store → location (matches the server
  // resolver in lib/actions/context.ts which reads cookies in the same order).
  const active: Destination | null = useMemo(() => {
    if (warehouse?.id) return { kind: "warehouse", data: warehouse };
    if (currentStore?.id) return { kind: "store", data: currentStore };
    if (currentLocation?.id)
      return { kind: "location", data: currentLocation };
    return null;
  }, [warehouse, currentStore, currentLocation]);

  const totalDestinations =
    (locationList?.length ?? 0) +
    (storeList?.length ?? 0) +
    (warehouseList?.length ?? 0);

  // Group stores by their parent location for readability when a business
  // has multiple locations-with-stores.
  const storesByLocation = useMemo(() => {
    const map = new Map<string, Store[]>();
    (storeList ?? []).forEach((s) => {
      const key = s.locationId ?? "__orphan__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [storeList]);

  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    (locationList ?? []).forEach((l) => map.set(l.id, l.name));
    return map;
  }, [locationList]);

  const handlePick = useCallback(
    (dest: Destination) => {
      if (active?.kind === dest.kind && active.data.id === dest.data.id) return;
      setConfirm(dest);
      setIsOpen(false);
    },
    [active],
  );

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    setLoadingId(confirm.data.id);
    try {
      switch (confirm.kind) {
        case "location":
          await switchToLocation(confirm.data);
          break;
        case "store":
          await switchToStore(confirm.data);
          break;
        case "warehouse":
          await switchToWarehouse(confirm.data);
          break;
      }

      // Redirect based on destination + subscription state. Inactive
      // destinations bounce the user to the right recovery flow.
      if (confirm.kind === "warehouse") {
        const wh = confirm.data;
        window.location.href = wh.active
          ? "/warehouse"
          : "/select-location";
      } else if (confirm.kind === "store") {
        const st = confirm.data;
        window.location.href = st.active
          ? "/dashboard"
          : "/select-location";
      } else {
        const loc = confirm.data;
        window.location.href = loc.active
          ? "/dashboard"
          : `/subscription?location=${loc.id}`;
      }
    } catch (error) {
      Sentry.captureException(error);
      setLoadingId(null);
      setConfirm(null);
    }
  }, [confirm]);

  if (totalDestinations <= 1 && !active) return null;

  const ActiveIcon = active ? KIND_META[active.kind].icon : MapPin;
  const activeName = active?.data.name ?? "Select workspace";

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 max-w-[260px] border-gray-200"
            disabled={loadingId !== null}
          >
            <ActiveIcon className="h-4 w-4 text-primary" />
            <span className="truncate text-sm font-medium">{activeName}</span>
            {active && (
              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                {KIND_META[active.kind].label}
              </span>
            )}
            {loadingId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[300px] bg-white/95 backdrop-blur-sm z-[60] max-h-[70vh] overflow-y-auto"
          align="end"
        >
          {/* Locations */}
          {locationList && locationList.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Locations
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {locationList.map((loc) => {
                  const isActive =
                    active?.kind === "location" && active.data.id === loc.id;
                  return (
                    <DropdownMenuItem
                      key={loc.id}
                      onClick={() => handlePick({ kind: "location", data: loc })}
                      className={cn(
                        "flex items-center gap-3 py-2.5 cursor-pointer",
                        isActive && "bg-orange-50",
                      )}
                      disabled={isActive}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {loc.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {loc.region && (
                            <p className="text-xs text-gray-500 truncate">
                              {loc.region}
                            </p>
                          )}
                          <StatusPill active={loc.active} />
                        </div>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </>
          )}

          {/* Stores, grouped by parent location */}
          {storeList && storeList.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <StoreIcon className="h-3 w-3" />
                Stores
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {Array.from(storesByLocation.entries()).map(
                  ([locationId, stores]) => (
                    <div key={locationId}>
                      {storesByLocation.size > 1 && (
                        <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                          {locationNameById.get(locationId) ?? "Unassigned"}
                        </p>
                      )}
                      {stores.map((store) => {
                        const isActive =
                          active?.kind === "store" &&
                          active.data.id === store.id;
                        return (
                          <DropdownMenuItem
                            key={store.id}
                            onClick={() =>
                              handlePick({ kind: "store", data: store })
                            }
                            className={cn(
                              "flex items-center gap-3 py-2.5 cursor-pointer",
                              isActive && "bg-orange-50",
                            )}
                            disabled={isActive}
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {store.name}
                              </p>
                              <div className="flex items-center gap-2">
                                {store.code && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {store.code}
                                  </p>
                                )}
                                <StatusPill active={store.active} />
                              </div>
                            </div>
                            {isActive && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  ),
                )}
              </DropdownMenuGroup>
            </>
          )}

          {/* Warehouses */}
          {warehouseList && warehouseList.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <Warehouse className="h-3 w-3" />
                Warehouses
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {warehouseList.map((wh) => {
                  const isActive =
                    active?.kind === "warehouse" && active.data.id === wh.id;
                  return (
                    <DropdownMenuItem
                      key={wh.id}
                      onClick={() =>
                        handlePick({ kind: "warehouse", data: wh })
                      }
                      className={cn(
                        "flex items-center gap-3 py-2.5 cursor-pointer",
                        isActive && "bg-orange-50",
                      )}
                      disabled={isActive}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {wh.name || "Unnamed warehouse"}
                        </p>
                        <div className="flex items-center gap-2">
                          {wh.code && (
                            <p className="text-xs text-gray-500 truncate">
                              {wh.code}
                            </p>
                          )}
                          {wh.primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              Primary
                            </span>
                          )}
                          <StatusPill active={wh.active} />
                        </div>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !loadingId) setConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Switch {confirm ? KIND_META[confirm.kind].label : "Workspace"}
            </DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirm?.data.name}</strong>? This will reload
              the page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={loadingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loadingId !== null}
              className="bg-primary hover:bg-orange-600 text-white"
            >
              {loadingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Switching...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "text-xs px-1.5 py-0.5 rounded",
        active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
