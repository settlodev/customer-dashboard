"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, MapPin, Building2, CheckCircle2 } from "lucide-react";
import { refreshLocation } from "@/lib/actions/business/refresh";
import { toast } from "@/hooks/use-toast";
import { Location } from "@/types/location/type";
import { cn } from "@/lib/utils";
import {subscriptionStatus} from "@/types/enums";

export function SelectLocation({ locations }: { locations: Location[] }) {
    const [, startTransition] = useTransition();
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);

    const setLocation = async (location: Location, index: number) => {
        setPendingIndex(index);

        if (location.subscriptionStatus === "EXPIRED" || location.subscriptionStatus === null) {
            toast({
                variant: "destructive",
                title: "Subscription Expired",
                description: "Your subscription has expired. Please renew your subscription to continue using the app.",
            });
            setTimeout(() => {
                document.location.href = `/subscription?location=${location.id}`;
            }, 3000);
        } else {
            await refreshLocation(location);
            document.location.href = "/dashboard";
        }
        setPendingIndex(null);
    };

    if (locations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                    No locations found for this business.
                    <br />
                    <span className="text-sm text-gray-500">
                        Please add a location to get started.
                    </span>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {locations.map((location, index) => (
                <div
                    key={location.id}
                    className={cn(
                        "relative group",
                        "rounded-lg border border-gray-200",
                        "transition-all duration-200 hover:shadow-md",
                        "bg-white overflow-hidden"
                    )}
                >
                    <div className="flex items-center p-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-emerald-600" />
                            </div>
                            {location.status && (
                                <div className="absolute -bottom-1 -right-1">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                            )}
                        </div>

                        <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {location.name}
                                </h3>
                                <span className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    location.subscriptionStatus == subscriptionStatus.OK
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-800"
                                )}>
                                    {location.subscriptionStatus}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{location.city}, {location.region}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                startTransition(() => {
                                    setLocation(location, index);
                                });
                            }}
                            disabled={pendingIndex === index}
                            className={cn(
                                "ml-4 px-4 py-2 rounded-full",
                                "text-sm font-medium",
                                "transition-all duration-200",
                                pendingIndex === index
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-emerald-500 text-white hover:bg-emerald-600",
                                "flex items-center space-x-2"
                            )}
                        >
                            {pendingIndex === index ? (
                                <>
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span>Selecting...</span>
                                </>
                            ) : (
                                <span>Select</span>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
