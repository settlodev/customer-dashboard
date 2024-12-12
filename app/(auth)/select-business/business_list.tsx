"use client"

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    MapPin,
    Loader2Icon,
    Search,
    ChevronRight,
    Globe2
} from "lucide-react";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import { refreshBusiness, refreshLocation } from "@/lib/actions/business/refresh";
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
import {useToast} from "@/hooks/use-toast";

const BusinessSelector = ({ businesses }: { businesses: Business[] }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const setCurrentBusiness = async (selectedBusiness: Business, index: number) => {
        setPendingIndex(index);
        setIsLoading(true);
        try {
            await refreshBusiness(selectedBusiness);
            setBusiness(selectedBusiness);
        } catch (error) {
            console.error("Error setting business:", error);
        }
        setIsLoading(false);
        setPendingIndex(null);
    };

    const filteredBusinesses = businesses.filter(bus =>
        bus.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section>
            <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
                <CardHeader className="text-center pb-2">
                    <CardTitle>
                        {business ? business.name : "Select Your Business"}
                    </CardTitle>
                    <CardDescription>
                        {business ? "Choose a location to continue" : "Get started by selecting your business"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Search Bar */}
                    <div className="flex items-center space-x-4 mb-6">
                        {business && (
                            <motion.button
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                onClick={() => setBusiness(null)}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600"/>
                            </motion.button>
                        )}
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                            <Input
                                type="text"
                                placeholder={business ? "Search locations..." : "Search businesses..."}
                                className="pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Selection List */}
                    <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-100">
                        <AnimatePresence mode="wait">
                            {business ? (
                                <LocationList
                                    locations={business.allLocations.filter(loc =>
                                        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    )}
                                />
                            ) : (
                                <motion.div
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    className="divide-y divide-gray-100"
                                >
                                    {filteredBusinesses.map((bus, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{opacity: 0, y: 20}}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: {delay: index * 0.1}
                                            }}
                                            className="p-4 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        {bus.logo ? (
                                                            <img
                                                                src={bus.logo}
                                                                alt={bus.name}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="w-6 h-6 text-emerald-600"/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">
                                                            {bus.name}
                                                        </h3>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Globe2 className="w-4 h-4 mr-1"/>
                                                            <span>
                                                                {bus.countryName} • {bus.totalLocations} {bus.totalLocations === 1 ? 'location' : 'locations'}
                                                              </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setCurrentBusiness(bus, index)}
                                                    disabled={isLoading}
                                                    className={cn(
                                                        "px-4 py-2 rounded-sm",
                                                        "text-sm font-medium",
                                                        "transition-all duration-200",
                                                        "flex items-center space-x-2",
                                                        pendingIndex === index
                                                            ? "bg-gray-100 text-gray-400"
                                                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                                                    )}
                                                >
                                                    {pendingIndex === index ? (
                                                        <>
                                                            <Loader2Icon className="w-4 h-4 animate-spin"/>
                                                            <span>Loading...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Select</span>
                                                            <ChevronRight className="w-4 h-4"/>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};

const LocationList = ({locations}: { locations: Location[] }) => {
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const { toast } = useToast();

    const handleLocationSelect = async (location: Location, index: number) => {
        setPendingIndex(index);

        if (location.subscriptionStatus === "EXPIRED") {
            toast({
                variant: "destructive",
                title: "Subscription Expired",
                description: "Please renew your subscription to continue.",
            });
            setTimeout(() => {
                window.location.href = `/subscription?location=${location.id}`;
            }, 2000);
        } else {
            await refreshLocation(location);
            window.location.href = "/dashboard";
        }
        setPendingIndex(null);
    };

    if (locations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-center">No locations found</p>
                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="divide-y divide-gray-100"
        >
            {locations.map((location, index) => (
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
                        <div>
                            <h3 className="font-medium text-gray-900">{location.name}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{location.city}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handleLocationSelect(location, index)}
                            disabled={pendingIndex === index}
                            className={cn(
                                "px-4 py-2 rounded-sm",
                                "text-sm font-medium",
                                "transition-all duration-200",
                                "flex items-center space-x-2",
                                pendingIndex === index
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-emerald-500 text-white hover:bg-emerald-600",
                                location.subscriptionStatus === subscriptionStatus.EXPIRED
                                    ? "bg-red-100 text-red-800"
                                    : ""
                            )}
                        >
                            {pendingIndex === index ? (
                                <>
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <span>Select</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default BusinessSelector;
