'use client'
import { useTransition, useEffect } from "react";
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

interface EfdSettingsFormProps {
  onSubmit: (data: EfdSettingsFormData) => Promise<void>;
  initialData?: Partial<EfdSettingsFormData>;
}

const EfdSettingsForm = ({ onSubmit, initialData }: EfdSettingsFormProps) => {
    const [isPending, startTransition] = useTransition();
    const session = useSession();

    const form = useForm<EfdSettingsFormData>({
        resolver: zodResolver(efdSettingsSchema),
        defaultValues: {
            isEfdEnabled: false,
            businessName: "",
            tin: "",
            email: "",
            phoneNumber: "",
            ...initialData,
        },
    });

    const isEfdEnabled = form.watch("isEfdEnabled");

    // Set session data when available
    useEffect(() => {
        if (session.data?.user?.email && !form.getValues("email")) {
            form.setValue("email", session.data.user.email);
        }
        if (session.data?.user?.phoneNumber && !form.getValues("phoneNumber")) {
            form.setValue("phoneNumber", session.data.user.phoneNumber);
        }
    }, [session.data, form]);

    // Clear form fields when EFD is disabled (but preserve email and phone from session)
    useEffect(() => {
        if (!isEfdEnabled) {
            form.setValue("businessName", "");
            form.setValue("tin", "");
        }
    }, [isEfdEnabled, form]);

    const handleSubmit = (data: EfdSettingsFormData) => {
        startTransition(async () => {
            await onSubmit(data);
        });
    };
    
    return (
        <Form {...form}>
            <div className="space-y-6">
                {/* EFD Enable/Disable Switch */}
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
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Conditional form fields - only show when EFD is enabled */}
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

                            {/* Business Name */}
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
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* TIN */}
                            <FormField
                                control={form.control}
                                name="tin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIN (Tax Identification Number) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter 9-digit TIN number"
                                                {...field}
                                                maxLength={9}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter business email address"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phone Number */}
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

                {/* Submit Button */}
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