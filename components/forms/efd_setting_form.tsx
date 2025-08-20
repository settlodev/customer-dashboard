
'use client'
import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { PhoneInput } from "../ui/phone-input";
import SubmitButton from "../widgets/submit-button";
import { EfdSettingsFormData, efdSettingsSchema } from "@/types/efd/schema";
import { Business } from "@/types/business/type";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { RequestEfd } from "@/lib/actions/efd-action";
import { useToast } from "@/hooks/use-toast";

interface EfdSettingsFormProps {
  initialData?: Partial<EfdSettingsFormData>;
}

const EfdSettingsForm = ({ initialData }: EfdSettingsFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [business, setBusiness] = useState<Business | undefined>();
    const [tinDisplayValue, setTinDisplayValue] = useState("");
    const [isSuccessful, setIsSuccessful] = useState(false);
    const session = useSession();
    const { toast } = useToast();

    const formatTinForDisplay = (tin: string): string => {
        const digits = tin.replace(/\D/g, ''); 
        if (digits.length >= 6) {
            return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
        } else if (digits.length >= 3) {
            return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        }
        return digits;
    };

    const extractTinDigits = (formattedTin: string): string => {
        return formattedTin.replace(/\D/g, '');
    };

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const currentBusiness = await getCurrentBusiness();
                console.log("The current business is", currentBusiness);
                setBusiness(currentBusiness);
            } catch (error) {
                console.error("Failed to fetch business:", error);
            }
        };
        
        fetchBusiness();
    }, []);

    const form = useForm<EfdSettingsFormData>({
        resolver: zodResolver(efdSettingsSchema),
        defaultValues: {
            isEfdEnabled: false,
            businessName: "",
            tinNumber: "",
            emailAddress: "",
            phoneNumber: "",
            ...initialData,
        },
    });

    const isEfdEnabled = form.watch("isEfdEnabled");

    useEffect(() => {
        if (business?.name && !form.getValues("businessName")) {
            form.setValue("businessName", business.name);
        }
        if (session.data?.user?.email && !form.getValues("emailAddress")) {
            form.setValue("emailAddress", session.data.user.email);
        }
        if (session.data?.user?.phoneNumber && !form.getValues("phoneNumber")) {
            form.setValue("phoneNumber", session.data.user.phoneNumber);
        }
        
        const currentTin = form.getValues("tinNumber");
        if (currentTin) {
            setTinDisplayValue(formatTinForDisplay(currentTin));
        }
    }, [session.data, business, form]);

    useEffect(() => {
        if (!isEfdEnabled) {
            form.setValue("businessName", business?.name || "");
            form.setValue("tinNumber", "");
            setTinDisplayValue("");
        }
    }, [isEfdEnabled, form, business?.name]);

    const handleSubmit = (data: EfdSettingsFormData) => {
        startTransition(async () => {
            try {
                if (!data.isEfdEnabled) {
                    toast({
                        title:'Success'
                    })
                }

                const submitData = {
                    ...data,
                    tinNumber: extractTinDigits(data.tinNumber || "")
                };

                const result = await RequestEfd(submitData);

                if (result.statusCode == 207) {
                    toast({
                        title:"Failed to onboard for EFd",
                        description:result.message,
                        variant:"destructive"
                    })
                  
                }
                if(result.statusCode == 200){
                    setIsSuccessful(true);
                    toast({
                        title:"Successful",
                        description:'EFD settings updated successfully'
                    });
                }
 
            } catch (error) {
                console.error("Error submitting EFD settings:", error);
                toast({
                    title:'Failed',
                    description:"Failed to onboard for TIN",
                    variant:"destructive"
                });
            }
        });
    };

    // Show success message when submission is successful
    if (isSuccessful) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-green-600 mb-2">
                        Success!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You have successfully onboarded for TIN, please wait while we are processing the details
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <Form {...form}>
            <div className="space-y-6">
                
                <FormField
                    control={form.control}
                    name="isEfdEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                    Enable EFD
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                    Turn on Electronic Fiscal Device for this location
                                </div>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isEfdEnabled && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <div className="mb-4">
                                <h4 className="text-lg font-medium">Business Information</h4>
                                <p className="text-sm text-muted-foreground">
                                    Please provide your business details for EFD registration.
                                </p>
                            </div>

                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your business name"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tinNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIN (Tax Identification Number) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="xxx-xxx-xxx"
                                                value={tinDisplayValue}
                                                onChange={(e) => {
                                                    const input = e.target.value;
                                                    const digits = input.replace(/\D/g, '');
                                                    
                                                    if (digits.length <= 9) {
                                                        const formatted = formatTinForDisplay(digits);
                                                        setTinDisplayValue(formatted);
                                                        
                                                        field.onChange(digits);
                                                    }
                                                }}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emailAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter business email address"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number *</FormLabel>
                                        <FormControl>
                                            <PhoneInput
                                                placeholder="Enter phone number"
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4">
                    <div onClick={form.handleSubmit(handleSubmit)}>
                        <SubmitButton 
                            isPending={isPending}
                            className="w-auto"
                            label="Save EFD Settings"
                        />
                    </div>
                </div>
            </div>
        </Form>
    );
};

export default EfdSettingsForm;