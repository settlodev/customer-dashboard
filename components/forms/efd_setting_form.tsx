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
import { RequestEfd, EfdStatus } from "@/lib/actions/efd-action";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatTinForDisplay } from "../helpers/tin_formatter";

interface EfdSettingsFormProps {
  initialData?: Partial<EfdSettingsFormData>;
}

interface EfdStatusData {
  isOnboarded: boolean;
  isVerified: boolean;
  completelyValid: boolean;
  businessName?: string;
  tinNumber?: string;
  emailAddress?: string;
  phoneNumber?: string;
}

const EfdSettingsForm = ({ initialData }: EfdSettingsFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [isStatusLoading, setIsStatusLoading] = useState(true);
    const [business, setBusiness] = useState<Business | undefined>();
    const [tinDisplayValue, setTinDisplayValue] = useState("");
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [efdStatus, setEfdStatus] = useState<EfdStatusData | null>(null);
    const session = useSession();
    const { toast } = useToast();

   

    const extractTinDigits = (formattedTin: string): string => {
        return formattedTin.replace(/\D/g, '');
    };

    // Fetch EFD status on component mount
    useEffect(() => {
        const fetchEfdStatus = async () => {
            try {
                setIsStatusLoading(true);
                const status = await EfdStatus();
                console.log("EFD Status:", status);
                
                if (status) {
                    setEfdStatus({
                        isOnboarded: status.isOnboarded || false,
                        isVerified: status.isVerified || false,
                        completelyValid: status?.completelyValid || false,
                        // businessName: status.data?.businessName,
                        // tinNumber: status.data?.tinNumber,
                        // emailAddress: status.data?.emailAddress,
                        // phoneNumber: status.data?.phoneNumber,
                    });
                } else {
                    // If no status found, user is not onboarded
                    setEfdStatus({
                        isOnboarded: false,
                        isVerified: false,
                        completelyValid: false,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch EFD status:", error);
                // Default to not onboarded if error occurs
                setEfdStatus({
                    isOnboarded: false,
                    isVerified: false,
                    completelyValid: false,
                });
            } finally {
                setIsStatusLoading(false);
            }
        };

        fetchEfdStatus();
    }, []);

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

    // Set initial form values based on status and business data
    useEffect(() => {
        if (!isStatusLoading && efdStatus) {
            // If user is onboarded, enable EFD switch and populate form with existing data
            if (efdStatus.isOnboarded) {
                form.setValue("isEfdEnabled", true);
                if (efdStatus.businessName) form.setValue("businessName", efdStatus.businessName);
                if (efdStatus.tinNumber) {
                    form.setValue("tinNumber", efdStatus.tinNumber);
                    setTinDisplayValue(formatTinForDisplay(efdStatus.tinNumber));
                }
                if (efdStatus.emailAddress) form.setValue("emailAddress", efdStatus.emailAddress);
                if (efdStatus.phoneNumber) form.setValue("phoneNumber", efdStatus.phoneNumber);
            } else {
                // If not onboarded, populate with business/session data
                if (business?.name && !form.getValues("businessName")) {
                    form.setValue("businessName", business.name);
                }
                if (session.data?.user?.email && !form.getValues("emailAddress")) {
                    form.setValue("emailAddress", session.data.user.email);
                }
                if (session.data?.user?.phoneNumber && !form.getValues("phoneNumber")) {
                    form.setValue("phoneNumber", session.data.user.phoneNumber);
                }
            }
        }
    }, [isStatusLoading, efdStatus, session.data, business, form]);

    useEffect(() => {
        if (!isEfdEnabled && !efdStatus?.isOnboarded) {
            form.setValue("businessName", business?.name || "");
            form.setValue("tinNumber", "");
            setTinDisplayValue("");
        }
    }, [isEfdEnabled, form, business?.name, efdStatus?.isOnboarded]);

    const handleSubmit = (data: EfdSettingsFormData) => {
        startTransition(async () => {
            try {
                if (!data.isEfdEnabled && !efdStatus?.isOnboarded) {
                    toast({
                        title: 'Success',
                        description: 'EFD settings updated'
                    });
                    return;
                }

                const submitData = {
                    ...data,
                    tinNumber: extractTinDigits(data.tinNumber || "")
                };

                const result = await RequestEfd(submitData);

                if (result.statusCode === 207) {
                    toast({
                        title: "Failed to onboard for EFD",
                        description: result.message,
                        variant: "destructive"
                    });
                } else if (result.statusCode === 200) {
                    setIsSuccessful(true);
                    // Refresh EFD status after successful onboarding
                    const updatedStatus = await EfdStatus();
                    if (updatedStatus.statusCode === 200) {
                        setEfdStatus({
                            isOnboarded: updatedStatus.isOnboarded || true,
                            isVerified: updatedStatus.isVerified || false,
                            completelyValid: updatedStatus.completelyValid || false,
                            // businessName: updatedStatus.data?.businessName,
                            // tinNumber: updatedStatus.data?.tinNumber,
                            // emailAddress: updatedStatus.data?.emailAddress,
                            // phoneNumber: updatedStatus.data?.phoneNumber,
                        });
                    }
                    toast({
                        title: "Successful",
                        description: 'EFD settings updated successfully'
                    });
                }
            } catch (error) {
                console.error("Error submitting EFD settings:", error);
                toast({
                    title: 'Failed',
                    description: "Failed to onboard for EFD",
                    variant: "destructive"
                });
            }
        });
    };

    // Show loading state while fetching status
    if (isStatusLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show success message when submission is successful
    if (isSuccessful) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-green-600 mb-2">
                        Success!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You have successfully onboarded for EFD, please wait while we process the verification
                    </p>
                </div>
            </div>
        );
    }

    // Show status if user is already onboarded
    if (efdStatus?.isOnboarded) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        {efdStatus.isVerified && efdStatus.completelyValid ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : efdStatus.isVerified ? (
                            <Clock className="h-6 w-6 text-blue-600" />
                        ) : (
                            <Clock className="h-6 w-6 text-yellow-600" />
                        )}
                        <div>
                            <h3 className="text-lg font-medium">
                                {efdStatus.isVerified && efdStatus.completelyValid
                                    ? "Onboarded and Verified for EFD Receipts" 
                                    : efdStatus.isVerified
                                    ? "EFD Verified - Final Setup in Progress"
                                    : "EFD waiting for Verification"
                                }
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {efdStatus.isVerified && efdStatus.completelyValid
                                    ? "Your business is successfully verified and can issue EFD receipts"
                                    : efdStatus.isVerified
                                    ? "Your EFD is verified, completing final setup processes"
                                    : "Your EFD onboarding is complete, verification is in progress"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Display current EFD details */}
                    <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            {efdStatus.businessName && (
                                <div>
                                    <span className="font-medium">Business Name:</span>
                                    <p className="text-muted-foreground">{efdStatus.businessName}</p>
                                </div>
                            )}
                            {efdStatus.tinNumber && (
                                <div>
                                    <span className="font-medium">TIN Number:</span>
                                    <p className="text-muted-foreground">
                                        {formatTinForDisplay(efdStatus.tinNumber)}
                                    </p>
                                </div>
                            )}
                            {efdStatus.emailAddress && (
                                <div>
                                    <span className="font-medium">Email:</span>
                                    <p className="text-muted-foreground">{efdStatus.emailAddress}</p>
                                </div>
                            )}
                            {efdStatus.phoneNumber && (
                                <div>
                                    <span className="font-medium">Phone:</span>
                                    <p className="text-muted-foreground">{efdStatus.phoneNumber}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className="mt-4 flex items-center space-x-2 text-sm">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            efdStatus.completelyValid && efdStatus.isVerified
                                ? 'bg-green-100 text-green-800'
                                : efdStatus.isVerified
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {efdStatus.completelyValid && efdStatus.isVerified ? 'Fully Active' : 
                             efdStatus.isVerified ? 'Setup in Progress' : 'Pending Verification'}
                        </div>
                    </div>

                    {!efdStatus.completelyValid && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-yellow-800">
                                        {!efdStatus.isVerified 
                                            ? "Verification typically takes 1-3 business days. You'll be notified once approved."
                                            : "Final setup is being completed. Your EFD will be fully active soon."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // Show onboarding form if user is not onboarded
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