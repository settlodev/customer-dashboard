"use client";

import * as Sentry from "@sentry/nextjs";
import { ChevronDown, MapPin, Warehouse, Loader2, Check } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Location } from "@/types/location/type";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { refreshLocation } from "@/lib/actions/business/refresh";

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
import { useRouter } from "next/navigation";
import { AuthenticationError } from "@/lib/settlo-api-client";
import { refreshWarehouse } from "@/lib/actions/warehouse/register-action";

const SWITCHER_STATE_KEY = "location_switcher_active";

interface LocationSwitcherProps {
  locationList: Location[] | null | undefined;
  currentLocation: Location | undefined;
  warehouse: Warehouses | undefined;
  warehouseList: Warehouses[];
}

export const LocationSwitcher = ({
  locationList,
  currentLocation,
  warehouse,
  warehouseList,
}: LocationSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{
    data: Location | Warehouses;
    type: "location" | "warehouse";
  } | null>(null);

  const [activeType, setActiveType] = useState<"location" | "warehouse">(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(SWITCHER_STATE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.type ?? (warehouse?.id ? "warehouse" : "location");
        } catch {
          // fall through
        }
      }
    }
    return warehouse?.id ? "warehouse" : "location";
  });

  const [activeItem, setActiveItem] = useState<
    Location | Warehouses | undefined
  >(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(SWITCHER_STATE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.item ?? (warehouse?.id ? warehouse : currentLocation);
        } catch {
          // fall through
        }
      }
    }
    return warehouse?.id ? warehouse : currentLocation;
  });

  const router = useRouter();

  const isWarehouseMode = activeType === "warehouse"; // ✅ driven by local state, not prop
  const locationCount = locationList?.length ?? 0;

  // ✅ Clear sessionStorage once server props reflect the switch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(SWITCHER_STATE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const serverNowMatchesIntent =
        (parsed.type === "warehouse" && warehouse?.id === parsed.item?.id) ||
        (parsed.type === "location" && currentLocation?.id === parsed.item?.id);

      if (serverNowMatchesIntent) {
        sessionStorage.removeItem(SWITCHER_STATE_KEY);
      }
    } catch {
      sessionStorage.removeItem(SWITCHER_STATE_KEY);
    }
  }, [warehouse?.id, currentLocation?.id]);

  const handleLocationSelect = (location: Location) => {
    if (activeType === "location" && activeItem?.id === location.id) return;
    setConfirmItem({ data: location, type: "location" });
    setIsOpen(false);
  };

  const handleWarehouseSelect = (wh: Warehouses) => {
    if (activeType === "warehouse" && activeItem?.id === wh.id) return;
    setConfirmItem({ data: wh, type: "warehouse" });
    setIsOpen(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!confirmItem) return;

    setLoadingId(confirmItem.data.id);
    try {
      if (confirmItem.type === "warehouse") {
        await refreshWarehouse(confirmItem.data as Warehouses);
      } else {
        await refreshLocation(confirmItem.data);
      }

      sessionStorage.setItem(
        SWITCHER_STATE_KEY,
        JSON.stringify({ type: confirmItem.type, item: confirmItem.data }),
      );

      setActiveType(confirmItem.type);
      setActiveItem(confirmItem.data);
      setConfirmItem(null);
      setLoadingId(null);

      if (confirmItem.type === "warehouse") {
        const wh = confirmItem.data as Warehouses;
        if (
          wh.subscriptionStatus === "EXPIRED" ||
          wh.subscriptionStatus === null
        ) {
          router.replace("/select-location");
        } else {
          router.replace("/warehouse");
        }
      } else {
        const loc = confirmItem.data as Location;
        if (
          loc.subscriptionStatus === "EXPIRED" ||
          loc.subscriptionStatus === null
        ) {
          router.replace(`/subscription?location=${loc.id}`);
        } else {
          router.replace("/dashboard");
        }
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        router.replace("/login");
        return;
      }
      Sentry.captureException(error);
      setLoadingId(null);
      setConfirmItem(null);
    }
  }, [confirmItem, router]);
  const hasNothing = locationCount <= 1 && warehouseList.length === 0;
  if (hasNothing) return null;

  const activeName = activeItem?.name; // ✅ driven by local state
  const activeIcon = isWarehouseMode ? (
    <Warehouse className="h-4 w-4 text-primary" />
  ) : (
    <MapPin className="h-4 w-4 text-primary" />
  );

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 max-w-[220px] border-gray-200"
            disabled={loadingId !== null}
          >
            {activeIcon}
            <span className="truncate text-sm font-medium">
              {activeName || "Select location"}
            </span>
            {loadingId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[280px] bg-white/95 backdrop-blur-sm z-[60]"
          align="end"
        >
          {/* Locations section */}
          {locationList && locationList.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Locations
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {locationList.map((location) => {
                  // ✅ isActive driven by local state
                  const isActive =
                    activeType === "location" && activeItem?.id === location.id;
                  return (
                    <DropdownMenuItem
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 cursor-pointer",
                        isActive && "bg-orange-50",
                      )}
                      disabled={isActive}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {location.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {location.region && (
                            <p className="text-xs text-gray-500 truncate">
                              {location.region}
                            </p>
                          )}
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              location.subscriptionStatus === "EXPIRED" ||
                                location.subscriptionStatus === null
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600",
                            )}
                          >
                            {location.subscriptionStatus === "EXPIRED" ||
                            location.subscriptionStatus === null
                              ? "Expired"
                              : "Active"}
                          </span>
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

          {/* Warehouses section */}
          {warehouseList.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <Warehouse className="h-3 w-3" />
                Warehouses
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {warehouseList.map((wh) => {
                  // ✅ isActive driven by local state
                  const isActive =
                    activeType === "warehouse" && activeItem?.id === wh.id;
                  return (
                    <DropdownMenuItem
                      key={wh.id}
                      onClick={() => handleWarehouseSelect(wh)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 cursor-pointer",
                        isActive && "bg-orange-50",
                      )}
                      disabled={isActive}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {wh.name || "Unnamed Warehouse"}
                        </p>
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

      {/* Confirmation Dialog — unchanged */}
      <Dialog
        open={!!confirmItem}
        onOpenChange={(open) => {
          if (!open && !loadingId) setConfirmItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Switch{" "}
              {confirmItem?.type === "warehouse" ? "Warehouse" : "Location"}
            </DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirmItem?.data.name}</strong>? This will
              reload the page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmItem(null)}
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
