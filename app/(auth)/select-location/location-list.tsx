"use client"

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    MapPin,
    Loader2Icon,
    Search,
    ChevronRight
} from "lucide-react";
import { Location } from "@/types/location/type";
import { refreshLocation } from "@/lib/actions/business/refresh";
import { cn } from "@/lib/utils";
import { subscriptionStatus } from "@/types/enums";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const LocationList = ({ locations, businessName }: { locations: Location[], businessName: string }) => {
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const { toast } = useToast();

    const handleLocationSelect = async (location: Location, index: number) => {
        setPendingIndex(index);

        if (location.subscriptionStatus === "EXPIRED" || location.subscriptionStatus === null) {
            toast({
                variant: "destructive",
                title: "Subscription Expired",
                description: "Please renew your subscription to continue.",
            });
            setIsRedirecting(true);
            setTimeout(() => {
                window.location.href = `/subscription?location=${location.id}`;
            }, 3000);
        } else {
            setIsRedirecting(true);
            await refreshLocation(location);
            window.location.href = "/dashboard";
        }

        setPendingIndex(null);
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="relative">
            {isRedirecting && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
                    <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-emerald-600 font-medium">Redirecting...</p>
                </div>
            )}

            <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
                <CardHeader className="text-center pb-2">
                    <CardTitle>{businessName}</CardTitle>
                    <CardDescription>Choose a location to continue</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="relative flex-1 mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                        <Input
                            type="text"
                            placeholder="Search locations..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-100">
                        {filteredLocations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 text-center">No locations found</p>
                                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
                                <Button
                                    className="mt-4"
                                    onClick={() => {
                                        setIsRedirecting(true);
                                        window.location.href = "/business-location";
                                    }}
                                >
                                    Complete Setup
                                </Button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="divide-y divide-gray-100"
                            >
                                {filteredLocations.map((location, index) => (
                                    <motion.div
                                        key={location.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { delay: index * 0.1 }
                                        }}
                                        className={cn(
                                            "p-4 hover:bg-gray-50",
                                            "flex items-center justify-between"
                                        )}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <MapPin className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col justify-start gap-2">
                                                <h3 className="font-medium text-gray-900">{location.name}</h3>
                                                {location.city && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        <span>{location.city}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleLocationSelect(location, index)}
                                            disabled={pendingIndex === index || isRedirecting}
                                            className={cn(
                                                "px-4 py-2 rounded-sm",
                                                "text-sm font-medium",
                                                "transition-all duration-200",
                                                "flex items-center space-x-2",
                                                pendingIndex === index
                                                    ? "bg-gray-100 text-gray-400"
                                                    : "bg-emerald-500 text-white hover:bg-emerald-600",
                                                location.subscriptionStatus === subscriptionStatus.EXPIRED
                                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                                    : ""
                                            )}
                                        >
                                            {pendingIndex === index ? (
                                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Select</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};

export default LocationList;
