"use client";

import * as Sentry from "@sentry/nextjs";
import {
  ChevronDown,
  MapPin,
  Warehouse,
  Loader2,
  Check,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Location } from "@/types/location/type";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { refreshLocation } from "@/lib/actions/business/refresh";
import { deleteActiveWarehouseCookie } from "@/lib/actions/warehouse/current-warehouse-action";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";

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

interface LocationSwitcherProps {
  locationList: Location[] | null | undefined;
  currentLocation: Location | undefined;
  warehouse: any | undefined;
}

export const LocationSwitcher = ({
  locationList,
  currentLocation,
  warehouse,
}: LocationSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{
    data: Location | Warehouses;
    type: "location" | "warehouse";
  } | null>(null);
  const [warehouseList, setWarehouseList] = useState<Warehouses[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const isWarehouseMode = warehouse && warehouse.id;

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoadingWarehouses(true);
      try {
        const result = await searchWarehouses("", 0, 20);
        setWarehouseList(result?.content || []);
      } catch (error) {
        console.error("Failed to fetch warehouses:", error);
        setWarehouseList([]);
      } finally {
        setLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  const handleLocationSelect = (location: Location) => {
    if (currentLocation?.id === location.id && !isWarehouseMode) return;
    setConfirmItem({ data: location, type: "location" });
    setIsOpen(false);
  };

  const handleWarehouseSelect = (wh: Warehouses) => {
    if (warehouse?.id === wh.id && isWarehouseMode) return;
    setConfirmItem({ data: wh, type: "warehouse" });
    setIsOpen(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!confirmItem) return;

    setLoadingId(confirmItem.data.id);
    try {
      if (confirmItem.type === "location") {
        await deleteActiveWarehouseCookie();
      }
      await refreshLocation(confirmItem.data as Location);

      setConfirmItem(null);
      setLoadingId(null);

      if (confirmItem.type === "warehouse") {
        const wh = confirmItem.data as Warehouses;
        if (!wh.active) {
          window.location.href = "/select-location";
        } else {
          window.location.href = "/warehouse";
        }
      } else {
        const loc = confirmItem.data as Location;
        if (!loc.active) {
          window.location.href = `/subscription?location=${loc.id}`;
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      Sentry.captureException(error);
      setLoadingId(null);
      setConfirmItem(null);
    }
  }, [confirmItem]);

  const locationCount = locationList?.length ?? 0;
  const hasNothing = !loadingWarehouses && locationCount <= 1 && warehouseList.length === 0;

  if (hasNothing) return null;

  const activeName = isWarehouseMode
    ? warehouse?.name
    : currentLocation?.name;

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
                  const isActive =
                    !isWarehouseMode && currentLocation?.id === location.id;
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
                              !location.active
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600",
                            )}
                          >
                            {location.active ? "Active" : "Inactive"}
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
          {(warehouseList.length > 0 || loadingWarehouses) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                <Warehouse className="h-3 w-3" />
                Warehouses
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {loadingWarehouses ? (
                  <DropdownMenuItem
                    disabled
                    className="flex items-center justify-center py-3"
                  >
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </DropdownMenuItem>
                ) : (
                  warehouseList.map((wh) => {
                    const isActive =
                      isWarehouseMode && warehouse?.id === wh.id;
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
                  })
                )}
              </DropdownMenuGroup>
            </>
          )}

        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
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
