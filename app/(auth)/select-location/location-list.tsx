// "use client"

// import React, { useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import {
//     MapPin,
//     Loader2Icon,
//     Search,
//     ChevronRight,
//     PlusIcon,
//     Warehouse
// } from "lucide-react";
// import { Location } from "@/types/location/type";
// import { refreshLocation } from "@/lib/actions/business/refresh";
// import { cn } from "@/lib/utils";
// // import { subscriptionStatus } from "@/types/enums";
// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
//     CardDescription,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import WareHouseRegisterForm from "@/components/forms/warehouse/register_form";
// import { refreshWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

// const LocationList = ({ locations, businessName, warehouses }: { locations: Location[], businessName: string, warehouses: any[] }) => {
//     const [pendingIndex, setPendingIndex] = useState<number | null>(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [isRedirecting, setIsRedirecting] = useState(false);
//     const [locationType, setLocationType] = useState<"all" | "warehouse">("all");
//     const [showCreateModal, setShowCreateModal] = useState(false);
    
//     const { toast } = useToast();

//     // Instead of combining, we'll filter based on the selected tab
//     const displayedItems = useMemo(() => {
//         if (locationType === "warehouse") {
//             // Only show warehouses
//             return warehouses.map(warehouse => ({
//                 id: warehouse.id,
//                 name: warehouse.name,
//                 address: warehouse.address,
//                 city: warehouse.city,
//                 type: "warehouse",
//                 subscriptionStatus: "ACTIVE" 
//             }));
//         } else {
//             // Only show regular locations
//             return locations;
//         }
//     }, [locations, warehouses, locationType]);

//     const handleLocationSelect = async (item: any, index: number) => {
//         setPendingIndex(index);

//         // Check if it's a warehouse
//         const isWarehouse = locationType === "warehouse";
        
//         if (isWarehouse) {
//             // Handle warehouse selection
//             toast({
//                 title: "Warehouse Selected",
//                 description: `You've selected ${item.name} warehouse.`,
//             });
//             setIsRedirecting(true);
            
//             await refreshWarehouse(item);
            
//             setTimeout(() => {

//                 window.location.href = '/warehouse';
//             }, 1500);
//         } else {
//             // Original location selection logic
//             if (item.subscriptionStatus === "EXPIRED" || item.subscriptionStatus === null) {
//                 toast({
//                     variant: "destructive",
//                     title: "Subscription Expired",
//                     description: "Please renew your subscription to continue.",
//                 });
//                 setIsRedirecting(true);
//                 setTimeout(() => {
//                     window.location.href = `/renew-subscription?location=${item.id}`;
//                 }, 3000);
//             } else {
//                 setIsRedirecting(true);
//                 await refreshLocation(item);
//                 window.location.href = "/dashboard";
//             }
//         }

//         setPendingIndex(null);
//     };

//     const handleSuccessfulCreation = (location: Location) => {
//         console.log("Location created successfully:", location);
//         setIsRedirecting(true);
//         toast({
//             title: "Warehouse Created",
//             description: "Your warehouse has been created successfully.",
//         });
        
//         // Simulate reload/redirect
//         setTimeout(() => {
//             window.location.href = "/dashboard";
//         }, 1500);
//     };

//     const filteredItems = displayedItems.filter(item => 
//         item.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const getLocationIcon = (type: string) => {
//         switch(type?.toLowerCase()) {
//             case "warehouse":
//                 return <Warehouse className="w-6 h-6 text-blue-600" />;
//             default:
//                 return <MapPin className="w-6 h-6 text-emerald-600" />;
//         }
//     };

//     const getLocationBackground = (type: string) => {
//         switch(type?.toLowerCase()) {
//             case "warehouse":
//                 return "bg-blue-100";
//             default:
//                 return "bg-emerald-100";
//         }
//     };

//     const getLocationBadgeStyle = (type: string) => {
//         switch(type?.toLowerCase()) {
//             case "warehouse":
//                 return "border-blue-200 text-blue-700";
//             default:
//                 return "border-emerald-200 text-emerald-700";
//         }
//     };

//     return (
//         <section className="relative">
//             {isRedirecting && (
//                 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
//                     <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
//                     <p className="text-emerald-600 font-medium">Redirecting...</p>
//                 </div>
//             )}

//             {showCreateModal && (
//                 <WareHouseRegisterForm 
//                     setShowCreateModal={setShowCreateModal} 
//                     onSuccess={handleSuccessfulCreation}
//                 />
//             )}

//             <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
//                 <CardHeader className="text-center pb-2">
//                     <CardTitle>{businessName}</CardTitle>
//                     <CardDescription>Choose a {locationType === "warehouse" ? "warehouse" : "location"} to continue</CardDescription>
//                 </CardHeader>
//                 <CardContent className="p-6">
//                     <div className="flex gap-3 mb-6">
//                         <div className="relative flex-1">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
//                             <Input
//                                 type="text"
//                                 placeholder={`Search ${locationType === "warehouse" ? "warehouses" : "locations"}...`}
//                                 className="pl-10 w-full"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     <div className="flex border rounded-lg overflow-hidden mb-4">
//                         <button
//                             onClick={() => setLocationType("all")}
//                             className={cn(
//                                 "flex-1 py-2 text-sm font-medium",
//                                 locationType === "all" 
//                                     ? "bg-emerald-100 text-emerald-800" 
//                                     : "bg-white text-gray-600 hover:bg-gray-50"
//                             )}
//                         >
//                             <MapPin className="w-4 h-4 inline mr-1" />
//                             Locations
//                         </button>
//                         <button
//                             onClick={() => setLocationType("warehouse")}
//                             className={cn(
//                                 "flex-1 py-2 text-sm font-medium",
//                                 locationType === "warehouse" 
//                                     ? "bg-blue-100 text-blue-800" 
//                                     : "bg-white text-gray-600 hover:bg-gray-50"
//                             )}
//                         >
//                             <Warehouse className="w-4 h-4 inline mr-1" />
//                             Warehouses
//                         </button>
//                     </div>

//                     <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-100">
//                         {filteredItems.length === 0 ? (
//                             <div className="flex flex-col items-center justify-center p-8">
//                                 <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
//                                     {locationType === "warehouse" ? (
//                                         <Warehouse className="w-8 h-8 text-blue-400" />
//                                     ) : (
//                                         <MapPin className="w-8 h-8 text-gray-400" />
//                                     )}
//                                 </div>
//                                 <p className="text-gray-600 text-center">No {locationType === "warehouse" ? "warehouses" : "locations"} found</p>
//                                 <p className="text-sm text-gray-500">Try adjusting your search or create a new {locationType === "warehouse" ? "warehouse" : "location"}</p>
//                                 {locationType === "warehouse" && (
//                                     <Button
//                                         className="mt-4 bg-blue-600 hover:bg-blue-700"
//                                         onClick={() => setShowCreateModal(true)}
//                                     >
//                                         <PlusIcon className="w-4 h-4 mr-1" />
//                                         Create Warehouse
//                                     </Button>
//                                 )}
//                             </div>
//                         ) : (
//                             <motion.div
//                                 initial={{ opacity: 0 }}
//                                 animate={{ opacity: 1 }}
//                                 exit={{ opacity: 0 }}
//                                 className="divide-y divide-gray-100"
//                             >
//                                 {filteredItems.map((item, index) => (
//                                     <motion.div
//                                         key={item.id}
//                                         initial={{ opacity: 0, y: 20 }}
//                                         animate={{
//                                             opacity: 1,
//                                             y: 0,
//                                             transition: { delay: index * 0.1 }
//                                         }}
//                                         className={cn(
//                                             "p-4 hover:bg-gray-50",
//                                             "flex items-center justify-between"
//                                         )}
//                                     >
//                                         <div className="flex items-center space-x-4">
//                                             <div className={cn(
//                                                 "w-12 h-12 rounded-full flex items-center justify-center",
//                                                 getLocationBackground(item.type)
//                                             )}>
//                                                 {getLocationIcon(item.type)}
//                                             </div>
//                                             <div className="flex flex-col justify-start gap-2">
//                                                 <div className="flex items-center">
//                                                     <h3 className="font-medium text-gray-900">{item.name}</h3>
//                                                     <Badge 
//                                                         variant="outline" 
//                                                         className={cn(
//                                                             "ml-2 text-xs",
//                                                             getLocationBadgeStyle(item.type)
//                                                         )}
//                                                     >
//                                                         {item.type || (locationType === "warehouse" ? "Warehouse" : "Location")}
//                                                     </Badge>
//                                                 </div>
//                                                 {item.city && (
//                                                     <div className="flex items-center text-sm text-gray-500">
//                                                         <MapPin className="w-4 h-4 mr-1" />
//                                                         <span>{item.city}</span>
//                                                     </div>
//                                                 )}
//                                                 {item.address && (
//                                                     <div className="text-xs text-gray-400 truncate max-w-[180px]">
//                                                         {item.address}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>

//                                         <button
//                                             onClick={() => handleLocationSelect(item, index)}
//                                             disabled={pendingIndex === index || isRedirecting}
//                                             className={cn(
//                                                 "px-4 py-2 rounded-sm",
//                                                 "text-sm font-medium",
//                                                 "transition-all duration-200",
//                                                 "flex items-center space-x-2",
//                                                 pendingIndex === index
//                                                     ? "bg-gray-100 text-gray-400"
//                                                     : locationType === "warehouse"
//                                                         ? "bg-blue-600 text-white hover:bg-blue-700"
//                                                         : "bg-emerald-500 text-white hover:bg-emerald-600",
//                                                 (!locationType.includes("warehouse") && item.subscriptionStatus === "EXPIRED")
//                                                     ? "bg-red-100 text-red-800 hover:bg-red-200"
//                                                     : ""
//                                             )}
//                                         >
//                                             {pendingIndex === index ? (
//                                                 <Loader2Icon className="w-4 h-4 animate-spin" />
//                                             ) : (
//                                                 <>
//                                                     <span>Select</span>
//                                                     <ChevronRight className="w-4 h-4" />
//                                                 </>
//                                             )}
//                                         </button>
//                                     </motion.div>
//                                 ))}
//                             </motion.div>
//                         )}
//                     </div>
//                 </CardContent>
//             </Card>
//         </section>
//     );
// };

// export default LocationList; 


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
                window.location.href = `/renew-subscription?location=${location.id}`;
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