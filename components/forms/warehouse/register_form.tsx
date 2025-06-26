"use client"

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { createWarehouse } from "@/lib/actions/warehouse/register-action";
import { Business } from "@/types/business/type";
import { businessTimes } from "@/types/constants";
// import { FormResponse } from "@/types/types";
import { Location } from "@/types/location/type";
import { BusinessTimeType } from "@/types/types";
import { RegisterWarehouseSchema } from "@/types/warehouse/register-warehose-schema";
import { Warehouses } from "@/types/warehouse/warehouse/type";
// import { Warehouse } from "@/types/warehouse/warehouse/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Warehouse} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";

interface Props {
    setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
    onSuccess?: (location: Location) => void;
}

function WareHouseRegisterForm({ setShowCreateModal, onSuccess }: Props) {
    const [isPending, startTransition] = useTransition();
    const [business, setBusiness] = useState<Business | null>(null);
    const router = useRouter();
    // const [response, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();

    useEffect(() => {
        const fetchBusiness = async () => {
            const cookieBusiness = await getCurrentBusiness();
            setBusiness(cookieBusiness ?? null);
        };
        fetchBusiness();
    }, []);

    const form = useForm<z.infer<typeof RegisterWarehouseSchema>>({
        resolver: zodResolver(RegisterWarehouseSchema),
        defaultValues: {
            name: "",
            address: "",
            city: "",
            phone: "",
            image: "",
            email: "",
            description: "",
            openingTime: "",
            closingTime: "",
        }
    });
    useEffect(() => {
        if (business) {
            form.reset({
                ...form.getValues(),
                address: business.countryName || "",
                phone: business.notificationPhone || "",
                image: business.image || "",
                email: business.notificationEmailAddress || "",
            });
        }
    }, [business, form]);

    const onInvalid = useCallback(
        (errors: any) => {
            console.log(errors);
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please check the form for errors and try again.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof RegisterWarehouseSchema>) => {
        startTransition(async () => {
            try {
                const result = await createWarehouse({
                    ...values,
                });
                
                // Handle success
                toast({
                    title: "Success",
                    description: "Warehouse created successfully",
                });
                
                // If onSuccess callback exists, call it with the result
                if (onSuccess && result) {
                    onSuccess(result as unknown as Warehouses);
                }
                
                // Close the modal and navigate
                setShowCreateModal(false);
                toast({
                    title: "Success",
                    description: "Redirecting to warehouse page...",
                });
                router.push('/warehouse');
            } catch (error) {
                console.error("Error creating warehouse:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to create warehouse. Please try again.",
                });
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold">Create New Warehouse</h2>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Warehouse Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter warehouse name"
                                            disabled={isPending}
                                        />
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
                                    <FormLabel>
                                      Warehouse Phone Number *
                                    </FormLabel>
                                    <FormControl className="w-full border-1 rounded-sm">
                                    <PhoneInput
                                        placeholder="Enter phone number"
                                        {...field} disabled={isPending}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Warehouse Email Address *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter warehouse email"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        
                        
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            City/Region *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="City"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                       
                       <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                         Warehouse Full Address *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter warehouse full address"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                       Warehouse Description
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Enter warehouse description"
                                            disabled={isPending}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                                    <div className="lg:grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="openingTime"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Opening Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending}
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select opening time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {businessTimes.length > 0
                                                                                ? businessTimes.map((item: BusinessTimeType, index: number) => (
                                                                                    <SelectItem key={index}
                                                                                        value={item.name}>
                                                                                        {item.label}
                                                                                    </SelectItem>
                                                                                ))
                                                                                : <></>}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">

                                                    <FormField
                                                        control={form.control}
                                                        name="closingTime"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Closing Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending}
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select closing time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {businessTimes.length > 0
                                                                                ? businessTimes.map((item: BusinessTimeType, index: number) => (
                                                                                    <SelectItem key={index}
                                                                                        value={item.name}>
                                                                                        {item.label}
                                                                                    </SelectItem>
                                                                                ))
                                                                                : <></>}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                        
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1"
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Warehouse"
                                )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}

export default WareHouseRegisterForm;