"use client";

import * as Sentry from "@sentry/nextjs";
import { ChevronDown, Building2, Loader2, Check } from "lucide-react";
import Image from "next/image";
import { useState, useCallback } from "react";
import { Business } from "@/types/business/type";
import { refreshBusiness, refreshLocation } from "@/lib/actions/business/refresh";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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

interface BusinessSwitcherProps {
  currentBusiness: Business | undefined;
  businessList: Business[];
}

export const BusinessSwitcher = ({
  currentBusiness,
  businessList,
}: BusinessSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmBusiness, setConfirmBusiness] = useState<Business | null>(null);

  const handleSelect = (business: Business) => {
    if (business.id === currentBusiness?.id) return;
    setConfirmBusiness(business);
    setIsOpen(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!confirmBusiness) return;

    setIsLoading(true);
    try {
      await refreshBusiness(confirmBusiness);

      // Auto-select location if the business has exactly one
      const locations = await fetchAllLocations();
      if (locations && locations.length === 1) {
        await refreshLocation(locations[0]);
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/select-location";
      }
    } catch (error) {
      Sentry.captureException(error);
      setIsLoading(false);
      setConfirmBusiness(null);
    }
  }, [confirmBusiness]);

  if (!currentBusiness) return null;

  const hasMultipleBusinesses = businessList.length > 1;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={!hasMultipleBusinesses}>
          <Button
            variant="ghost"
            className="w-full px-1 py-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="relative h-8 w-8 shrink-0">
                {currentBusiness.logo ? (
                  <Image
                    src={currentBusiness.logo}
                    alt={currentBusiness.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate w-full text-left">
                  {currentBusiness.name}
                </p>
                {currentBusiness.countryName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">
                    {currentBusiness.countryName}
                  </p>
                )}
              </div>
              {hasMultipleBusinesses && (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[260px] bg-white/95 backdrop-blur-sm z-[99999]"
          align="start"
          side="right"
        >
          <DropdownMenuLabel className="text-xs font-normal text-gray-500">
            Switch business
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {businessList.map((business) => {
              const isActive = currentBusiness.id === business.id;
              return (
                <DropdownMenuItem
                  key={business.id}
                  onClick={() => handleSelect(business)}
                  className={cn(
                    "flex items-center gap-3 py-3 cursor-pointer",
                    isActive && "bg-gray-100",
                  )}
                  disabled={isActive}
                >
                  <div className="relative h-8 w-8 shrink-0">
                    {business.logo ? (
                      <Image
                        src={business.logo}
                        alt={business.name}
                        fill
                        className="rounded-lg object-cover bg-primary/20 p-0.5"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {business.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {business.countryName} &middot; {business.totalLocations}{" "}
                      {business.totalLocations === 1 ? "location" : "locations"}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={!!confirmBusiness}
        onOpenChange={(open) => {
          if (!open && !isLoading) setConfirmBusiness(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Business</DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirmBusiness?.name}</strong>? You will be
              redirected to select a location.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmBusiness(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-primary hover:bg-orange-600 text-white"
            >
              {isLoading ? (
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
