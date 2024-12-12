import { ChevronDown, Plus } from "lucide-react";
import Image from "next/image";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {useRouter} from "next/navigation";

export const CompaniesDropdown = ({ data }: { data: BusinessPropsType }) => {
    const { business, currentLocation, locationList } = data;
    const router = useRouter();

    const onRefreshLocation = async (location: Location) => {
        await refreshLocation(location);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full px-2 hover:bg-gray-700/50"
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
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[260px] bg-white/95 backdrop-blur-sm"
                align="start"
                side="right"
            >
                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                    Switch location
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    {locationList && locationList.map((location: Location) => {
                        const isActive = currentLocation?.id === location.id;
                        return (
                            <DropdownMenuItem
                                key={location.id}
                                onClick={() => !isActive && onRefreshLocation(location)}
                                className={cn(
                                    "flex items-center gap-3 py-3 cursor-pointer",
                                    isActive && "bg-gray-100"
                                )}
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
                                {isActive && (
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
                >
                    <Button
                        className="w-full bg-emerald-400 hover:bg-emerald-500 text-gray-800"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add business location
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
