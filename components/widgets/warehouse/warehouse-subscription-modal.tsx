
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { searchWarehousesSubscriptionPackages } from "@/lib/actions/warehouse/subscription";
import { warehouseInvoiceSchema } from "@/types/warehouse/invoice/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Badge, CreditCard, Loader2Icon, Package, Warehouse, X, Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";

type InvoiceFormData = z.infer<typeof warehouseInvoiceSchema>;

const WarehouseSubscriptionModal = ({ 
    warehouse, 
    onClose, 
    onSubscribe 
}: { 
    warehouse: any; 
    onClose: () => void; 
    onSubscribe: (packageId: string, email: string, phone: string, numberOfMonths: number) => void; 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [subscriptionPackages, setSubscriptionPackages] = useState<any[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(warehouseInvoiceSchema),
        defaultValues: {
            warehouseSubscriptions: [{
                subscription: '',
                numberOfMonths: 1,
                subscriptionDiscount: undefined
            }],
            email: '',
            phone: ''
        }
    });

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setPackagesLoading(true);
                const packages = await searchWarehousesSubscriptionPackages();
                const packageList = packages.content || [];
                setSubscriptionPackages(packageList);
                
                // Auto-select the first package if only one exists
                if (packageList.length === 1) {
                    form.setValue('warehouseSubscriptions.0.subscription', packageList[0].id);
                }
                
                // If multiple packages, auto-select the first one as default
                if (packageList.length > 1) {
                    form.setValue('warehouseSubscriptions.0.subscription', packageList[0].id);
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
            } finally {
                setPackagesLoading(false);
            }
        };
        fetchPackages();
    }, [form]);

    const onFormError = useCallback((errors: any) => {
        const firstError = Object.values(errors)[0] as any;
        if (firstError?.message) {
            // Handle error display if needed
        }
    }, []);

    const handleCreateWarehouseInvoice = async (data: InvoiceFormData) => {
        const selectedSubscriptionId = data.warehouseSubscriptions[0]?.subscription;
        
        if (!selectedSubscriptionId) {
            console.error('No subscription package selected');
            return;
        }

        setIsLoading(true);
        try {
            const numberOfMonths = data.warehouseSubscriptions[0]?.numberOfMonths || 1;
            const email = data.email;
            const phone = data.phone;
            
            if (!email || !phone) {
                throw new Error('Email and phone are required');
            }
            await onSubscribe(
                typeof selectedSubscriptionId === 'string' ? selectedSubscriptionId : selectedSubscriptionId.id,
                email,
                phone,
                numberOfMonths
            );
        } catch (error) {
            console.error('Error creating warehouse invoice:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Watch form values to enable/disable submit button
    const watchedValues = form.watch();
    const isFormValid = 
        watchedValues.warehouseSubscriptions?.[0]?.numberOfMonths > 0 &&
        watchedValues.warehouseSubscriptions?.[0]?.subscription &&
        watchedValues.email &&
        watchedValues.phone;

    if (packagesLoading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Loading Packages...</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center p-8">
                        <Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Warehouse Subscription Required
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Warehouse Info */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">{warehouse.name}</h3>
                            {warehouse.city && (
                                <p className="text-sm text-gray-500">{warehouse.city}</p>
                            )}
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateWarehouseInvoice, onFormError)} className="space-y-6">  
                            {/* Subscription Package Selection */}
                            {subscriptionPackages.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">
                                    No subscription packages available.
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="warehouseSubscriptions.0.subscription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subscription Package *</FormLabel>
                                            <FormControl>
                                                {subscriptionPackages.length === 1 ? (
                                                    // Single package - show as selected card
                                                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 relative">
                                                        <div className="absolute top-3 right-3">
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>
                                                        {subscriptionPackages.map((item: any) => (
                                                            <div key={item.id} className="pr-8">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Package className="w-5 h-5 text-blue-600" />
                                                                        <h4 className="font-medium text-gray-900 capitalize">
                                                                            {item.name} Package
                                                                        </h4>
                                                                    </div>
                                                                    <Badge className="border-blue-200 text-blue-700">
                                                                        {item.code?.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                                                    TZS {item.amount?.toLocaleString()} 
                                                                    <span className="text-base font-normal text-gray-500"> / month</span>
                                                                </div>
                                                                {item.discount && (
                                                                    <div className="text-sm text-green-600 mb-1">
                                                                        Discount: {item.discount}% off
                                                                    </div>
                                                                )}
                                                                {item.description && (
                                                                    <div className="text-sm text-gray-600">{item.description}</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Multiple packages - show as radio options
                                                    <RadioGroup
                                                        value={field.value as string}
                                                        onValueChange={(value) => field.onChange(value as string)}
                                                        className="space-y-3"
                                                    >
                                                        {subscriptionPackages.map((item: any) => (
                                                            <div
                                                                key={item.id}
                                                                className={cn(
                                                                    "border rounded-lg p-4 transition-colors cursor-pointer",
                                                                    field.value === item.id
                                                                        ? "border-blue-500 bg-blue-50"
                                                                        : "border-gray-200 hover:border-gray-300"
                                                                )}
                                                                onClick={() => field.onChange(item.id)}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <RadioGroupItem value={item.id} className="mt-1" />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="flex items-center space-x-2">
                                                                                <Package className="w-4 h-4 text-blue-600" />
                                                                                <h4 className="font-medium text-gray-900 capitalize">
                                                                                    {item.name} Package
                                                                                </h4>
                                                                            </div>
                                                                            <Badge className="border-blue-200 text-blue-700">
                                                                                {item.code?.toUpperCase()}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="text-xl font-bold text-blue-600 mb-1">
                                                                            TZS {item.amount?.toLocaleString()} 
                                                                            <span className="text-sm font-normal text-gray-500"> / month</span>
                                                                        </div>
                                                                        {item.discount && (
                                                                            <div className="text-sm text-green-600 mb-1">
                                                                                Discount: {item.discount}% off
                                                                            </div>
                                                                        )}
                                                                        {item.description && (
                                                                            <div className="text-sm text-gray-600">{item.description}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                )}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="warehouseSubscriptions.0.numberOfMonths"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Months *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter number of months"
                                                    min={1}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                    value={field.value || 1}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the number of months you want to subscribe for
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="customer@gmail.com" type="email" required />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number *</FormLabel>
                                            <FormControl>
                                                <PhoneInput
                                                    placeholder="Enter phone number"
                                                    {...field}
                                                    required
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    disabled={!isFormValid || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>  
                    </Form>
                </div>
            </motion.div>
        </div>
    );
};

export default WarehouseSubscriptionModal;