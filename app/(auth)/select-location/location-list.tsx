
"use client"

import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    MapPin,
    Loader2Icon,
    Search,
    ChevronRight,
    PlusIcon,
    Warehouse,
} from "lucide-react";
import { Location } from "@/types/location/type";
import { refreshLocation } from "@/lib/actions/business/refresh";
import { cn } from "@/lib/utils";
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
import WareHouseRegisterForm from "@/components/forms/warehouse/register_form";
import { refreshWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import WarehouseSubscriptionModal from "@/components/widgets/warehouse/warehouse-subscription-modal";
import { createWarehouseInvoice, payWarehouseInvoice, verifyWarehousePayment } from "@/lib/actions/warehouse/subscription";
import { UUID } from "crypto";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";




const LocationList = ({ locations, businessName, warehouses }: { locations: Location[], businessName: string, warehouses: any[] }) => {
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [locationType, setLocationType] = useState<"all" | "warehouse">("all");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<"INITIATING"|"PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    
    const { toast } = useToast();

    // Instead of combining, we'll filter based on the selected tab
    const displayedItems = useMemo(() => {
        if (locationType === "warehouse") {
            return warehouses;
        } else {
            return locations;
        }
    }, [locations, warehouses, locationType]);

    
    const handlePendingPayment = useCallback((transactionId: string, invoice: string) => {
        
        setTimeout(() => {
          let attemptCount = 0;
          const maxAttempts = 12;
          const pollingInterval = 5000;
          const maxDuration = 300000;
          const startTime = Date.now();
          
          const verificationInterval = setInterval(async () => {
            attemptCount++;
    
            if (Date.now() - startTime > maxDuration) {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
              toast({
                title: "Payment Timeout",
                description: "Payment verification timed out. Please check your payment status.",
                variant: "destructive"
              });
              return;
            }
            
            try {
              // console.log("Verification attempt:", attemptCount);
              const verificationResult = await verifyWarehousePayment(transactionId, invoice);
              setPaymentStatus(verificationResult.invoicePaymentStatus);
              
              if (verificationResult.invoicePaymentStatus === "SUCCESS") {
                clearInterval(verificationInterval);
                handleSuccessfulPayment(verificationResult);
              } else if (verificationResult.invoicePaymentStatus === "PROCESSING") {
                setPaymentStatus("PROCESSING");
              } else if (verificationResult.invoicePaymentStatus === "FAILED") {
                clearInterval(verificationInterval);
                setPaymentStatus("FAILED");
                setTimeout(() => {
                  setIsModalOpen(false);
                }, 2000);
              } else if (attemptCount >= maxAttempts) {
                clearInterval(verificationInterval);
                setPaymentStatus("FAILED");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
            }
          }, pollingInterval);
        }, 20000);
      }, [toast]);

      const handleWarehouseSubscription = async (packageId: string, email: string, phone: string, numberOfMonths: number) => {
        try {
            setIsModalOpen(true); // Open modal immediately
            setPaymentStatus("INITIATING");
            
            const invoicePayload = {
                warehouseSubscriptions: [{
                    numberOfMonths,
                    subscription: packageId
                }],
                email,
                phone
            }
    
            const response = await createWarehouseInvoice(invoicePayload);
    
            if (response && typeof response === 'object' && 'id' in response) {
                const invoiceId = (response as { id: UUID }).id;
    
                try {
                    setPaymentStatus("PENDING");
                    const paymentResponse = await payWarehouseInvoice(invoiceId, email, phone);
    
                    setPaymentStatus("PROCESSING");
                    handlePendingPayment(paymentResponse.id, paymentResponse.warehouseInvoice);
                    
                    // Don't close modal or redirect here - wait for payment verification
                } catch (error) {
                    console.error('Error paying invoice:', error);
                    setPaymentStatus("FAILED");
                    setTimeout(() => {
                        setIsModalOpen(false);
                    }, 3000);
                }
            }
    
            // Remove the success toast and warehouse selection from here
            setShowSubscriptionModal(false);
            setSelectedWarehouse(null);
    
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            setPaymentStatus("FAILED");
            setTimeout(() => {
                setIsModalOpen(false);
            }, 3000);
            
            toast({
                variant: "destructive",
                title: "Subscription Failed",
                description: "There was an error processing your subscription. Please try again.",
            });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleSuccessfulPayment = useCallback((response: any) => {
        toast({
            title: "Subscription Successful",
            description: "Your warehouse subscription has been activated.",
        });
        
        setTimeout(async () => {
            setIsModalOpen(false);
            setIsRedirecting(true);
            await refreshWarehouse(selectedWarehouse);
            window.location.href = `/warehouse`;
        }, 2000);
    }, [selectedWarehouse, toast]);

    const handleLocationSelect = async (item: any, index: number) => {
        setPendingIndex(index);

        const isWarehouse = locationType === "warehouse";
        
        if (isWarehouse) {
            // Check warehouse subscription status
            if (item.subscriptionStatus === "EXPIRED" || 
                item.subscriptionStatus === null || 
                item.subscriptionStatus === "" || 
                item.subscriptionStatus === undefined) {
                
                setSelectedWarehouse(item);
                setShowSubscriptionModal(true);
                setPendingIndex(null);
                return;
            }
            
            setIsRedirecting(true);
            await refreshWarehouse(item);
            
            setTimeout(() => {
                window.location.href = '/warehouse';
            }, 1500);
        } else {
            // Original location selection logic
            if (item.subscriptionStatus === "EXPIRED" || item.subscriptionStatus === null) {
                toast({
                    variant: "destructive",
                    title: "Subscription Expired",
                    description: "Please renew your subscription to continue.",
                });
                setIsRedirecting(true);
                setTimeout(() => {
                    window.location.href = `/renew-subscription?location=${item.id}`;
                }, 3000);
            } else {
                setIsRedirecting(true);
                await refreshLocation(item);
                window.location.href = "/dashboard";
            }
        }

        setPendingIndex(null);
    };

    const handleSuccessfulCreation = (location: Location) => {
        console.log("Location created successfully:", location);
        setIsRedirecting(true);
        toast({
            title: "Warehouse Created",
            description: "Your warehouse has been created successfully.",
        });
        
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1500);
    };

    const filteredItems = displayedItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLocationIcon = (type: string) => {
        switch(type?.toLowerCase()) {
            case "warehouse":
                return <Warehouse className="w-6 h-6 text-blue-600" />;
            default:
                return <MapPin className="w-6 h-6 text-emerald-600" />;
        }
    };

    const getLocationBackground = (type: string) => {
        switch(type?.toLowerCase()) {
            case "warehouse":
                return "bg-blue-100";
            default:
                return "bg-emerald-100";
        }
    };

    
    const getButtonStyle = (item: any, index: number) => {
        if (pendingIndex === index) {
            return "bg-gray-100 text-gray-400";
        }

        const isWarehouse = locationType === "warehouse";
        const hasExpiredSubscription = item.subscriptionStatus === "EXPIRED" || 
                                     item.subscriptionStatus === null || 
                                     item.subscriptionStatus === "" || 
                                     item.subscriptionStatus === undefined;

        if (isWarehouse && hasExpiredSubscription) {
            return "bg-orange-500 text-white hover:bg-orange-600";
        }

        if (isWarehouse) {
            return "bg-blue-600 text-white hover:bg-blue-700";
        }

        if (!isWarehouse && hasExpiredSubscription) {
            return "bg-red-100 text-red-800 hover:bg-red-200";
        }

        return "bg-emerald-500 text-white hover:bg-emerald-600";
    };

    const getButtonText = (item: any) => {
        const isWarehouse = locationType === "warehouse";
        const hasExpiredSubscription = item.subscriptionStatus === "EXPIRED" || 
                                     item.subscriptionStatus === null || 
                                     item.subscriptionStatus === "" || 
                                     item.subscriptionStatus === undefined;

        if (isWarehouse && hasExpiredSubscription) {
            return "Subscribe";
        }

        return "Select";
    };

    return (
        <section className="relative">
            {isRedirecting && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
                    <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-emerald-600 font-medium">Redirecting...</p>
                </div>
            )}

            {showCreateModal && (
                <WareHouseRegisterForm 
                    setShowCreateModal={setShowCreateModal} 
                    onSuccess={handleSuccessfulCreation}
                />
            )}

            {showSubscriptionModal && selectedWarehouse && (
                <WarehouseSubscriptionModal
                    warehouse={selectedWarehouse}
                    onClose={() => {
                        setShowSubscriptionModal(false);
                        setSelectedWarehouse(null);
                    }}
                    onSubscribe={handleWarehouseSubscription}
                />
            )}

            <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
                <CardHeader className="text-center pb-2">
                    <CardTitle>{businessName}</CardTitle>
                    <CardDescription>Choose a {locationType === "warehouse" ? "warehouse" : "location"} to continue</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                            <Input
                                type="text"
                                placeholder={`Search ${locationType === "warehouse" ? "warehouses" : "locations"}...`}
                                className="pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex border rounded-lg overflow-hidden mb-4">
                        <button
                            onClick={() => setLocationType("all")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium",
                                locationType === "all" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Locations
                        </button>
                        <button
                            onClick={() => setLocationType("warehouse")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium",
                                locationType === "warehouse" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <Warehouse className="w-4 h-4 inline mr-1" />
                            Warehouses
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-100">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    {locationType === "warehouse" ? (
                                        <Warehouse className="w-8 h-8 text-blue-400" />
                                    ) : (
                                        <MapPin className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-gray-600 text-center">No {locationType === "warehouse" ? "warehouses" : "locations"} found</p>
                                <p className="text-sm text-gray-500">Try adjusting your search or create a new {locationType === "warehouse" ? "warehouse" : "location"}</p>
                                {locationType === "warehouse" && (
                                    <Button
                                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        Create Warehouse
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="divide-y divide-gray-100"
                            >
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
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
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center",
                                                getLocationBackground(item.type)
                                            )}>
                                                {getLocationIcon(item.type)}
                                            </div>
                                            <div className="flex flex-col justify-start gap-2">
                                                <div className="flex items-center">
                                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                </div>
                                                {item.city && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        <span>{item.city}</span>
                                                    </div>
                                                )}
                                                {item.address && (
                                                    <div className="text-xs text-gray-400 truncate max-w-[180px]">
                                                        {item.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleLocationSelect(item, index)}
                                            disabled={pendingIndex === index || isRedirecting}
                                            className={cn(
                                                "px-4 py-2 rounded-sm",
                                                "text-sm font-medium",
                                                "transition-all duration-200",
                                                "flex items-center space-x-2",
                                                getButtonStyle(item, index)
                                            )}
                                        >
                                            {pendingIndex === index ? (
                                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>{getButtonText(item)}</span>
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
            <PaymentStatusModal
            isOpen={isModalOpen}
            status={paymentStatus}
            onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
};

export default LocationList;