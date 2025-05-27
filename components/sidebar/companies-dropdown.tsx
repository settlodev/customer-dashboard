import * as Sentry from "@sentry/nextjs";

import { ChevronDown, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { Location } from "@/types/location/type";
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
    DialogTitle
  } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const CompaniesDropdown = ({ data }: { data: BusinessPropsType }) => {
    const { business, currentLocation, locationList } = data;
    const router = useRouter();
    const [loadingLocationId, setLoadingLocationId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const handleLocationSelect = (location: Location) => {
        const isActive = currentLocation?.id === location.id;

        console.log("Selected location:", location);
        
        if (isActive) return;
        
        // Set the selected location and open confirmation modal
        setSelectedLocation(location);
        setConfirmationOpen(true);
        setIsOpen(false); // Close the dropdown
    };

    const onRefreshLocation = async (location: Location) => {
        try {
            setLoadingLocationId(location.id);
            await refreshLocation(location).then(res => {
                Sentry.captureMessage("Location switched: " + res);
                setConfirmationOpen(false);
                setSelectedLocation(null);
                setLoadingLocationId(null);
                // Reload the page and redirect to dashboard
                window.location.href = '/dashboard';
            });
        } catch (error) {
            Sentry.captureException(error);
            setConfirmationOpen(false);
            setSelectedLocation(null);
            setLoadingLocationId(null);
        }
    };

    return (
        <>
            <DropdownMenu open={loadingLocationId ? true : isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full px-2 hover:bg-gray-700/50"
                        disabled={loadingLocationId !== null}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative h-8 w-8 shrink-0">
                                <Image
                                    src={business?.logo || '/images/logo.png'}
                                    alt={business?.name || 'Business logo'}
                                    fill
                                    className="rounded-full object-cover bg-emerald-400 p-1"
                                />
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-200 truncate w-full">
                                    {business?.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate w-full">
                                    {currentLocation?.name}
                                </p>
                            </div>
                            {loadingLocationId ? (
                                <Loader2 className="h-4 w-4 text-gray-400 shrink-0 animate-spin" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                            )}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="hidden lg:block w-[260px] bg-white/95 backdrop-blur-sm z-99999"
                    align="start"
                    side="right"
                >
                    <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                        Switch location
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                        {locationList && locationList.map((location: Location) => {
                            const isActive = currentLocation?.id === location.id;
                            const isLoading = loadingLocationId === location.id;
                            return (
                                <DropdownMenuItem
                                    key={location.id}
                                    onClick={() => handleLocationSelect(location)}
                                    className={cn(
                                        "flex items-center gap-3 py-3 cursor-pointer",
                                        isActive && "bg-gray-100",
                                        isLoading && "opacity-70"
                                    )}
                                    disabled={isLoading || isActive}
                                >
                                    <div className="relative h-8 w-8 shrink-0">
                                        <Image
                                            src={business?.logo || '/images/logo.png'}
                                            alt={location.name}
                                            fill
                                            className="rounded-full object-cover bg-emerald-400 p-1"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {location.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {location.region}
                                        </p>
                                    </div>
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 text-emerald-500 animate-spin shrink-0" />
                                    ) : isActive && (
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => router.push("/locations/new")}
                        className="p-2 cursor-pointer"
                        disabled={loadingLocationId !== null}
                    >
                        <Button
                            className="w-full bg-emerald-400 hover:bg-emerald-500 text-gray-800"
                            size="sm"
                            disabled={loadingLocationId !== null}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add business location
                        </Button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Confirmation Modal */}
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Switch Location</DialogTitle>
                        <DialogDescription>
                            You are about to switch to {selectedLocation?.name}. This will reload the page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setConfirmationOpen(false);
                                setSelectedLocation(null);
                            }}
                            disabled={loadingLocationId !== null}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => selectedLocation && onRefreshLocation(selectedLocation)}
                            disabled={loadingLocationId !== null}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            {loadingLocationId ? (
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
