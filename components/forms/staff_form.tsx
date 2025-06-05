"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { createStaff, updateStaff } from "@/lib/actions/staff-actions";
import { Staff, StaffSchema } from "@/types/staff";
import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast"
import { PhoneInput } from "../ui/phone-input";
import { Switch } from "../ui/switch";
import { DefaultCountry } from "@/types/constants";
import DepartmentSelector from "@/components/widgets/department-selector";
import RoleSelector from "@/components/widgets/role-selector";
import CountrySelector from "@/components/widgets/country-selector";
import { Separator } from "../ui/separator";

interface StaffFormProps {
    item: Staff | null | undefined;
    onFormSubmitted?: (response: FormResponse) => void;
}

const StaffForm: React.FC<StaffFormProps> = ({
    item,
    onFormSubmitted,
}) => {
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();
    const [isDashboardEnabled, setIsDashboardEnabled] = useState(item?.dashboardAccess ?? false);

    const form = useForm<z.infer<typeof StaffSchema>>({
        resolver: zodResolver(StaffSchema),
        defaultValues: {
            ...item,
            nationality: item?.nationality || DefaultCountry,
            status: item ? item.status : true,
        },
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("onInvalid errors are ", errors);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: typeof errors.message === 'string' && errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast],
    );

    const submitData = async (values: z.infer<typeof StaffSchema>) => {
        setResponse(undefined);
    
        startTransition(async () => {
            try {
                let result: FormResponse | void;
                
                if (item) {
                    result = await updateStaff(item.id, values);
                } else {
                    result = await createStaff(values);
                }
    
                if (result) {
                    setResponse(result);
                    
                    if (result.responseType === "success") {
                        // Handle success
                        toast({
                            title: "Success!",
                            description: result.message,
                        });
                        onFormSubmitted?.(result);
                    } else if (result.responseType === "error") {
                        // Handle error from server action
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: result.message || "An error occurred while processing your request.",
                        });
                    }
                }
            } catch (error: any) {
                console.error("Form submission error:", error);
                
                // This catch block handles any errors that weren't caught by the server action
                let errorMessage = "There was an issue with your request, please try again later";
                
                // Try to extract error message
                if (error?.message) {
                    errorMessage = error.message;
                } else if (error?.digest) {
                    // This is a Next.js production error with digest
                    errorMessage = "A server error occurred. Please try again later.";
                }
                
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: errorMessage
                });
    
                // Set error response for form state
                const errorResponse: FormResponse = {
                    responseType: "error",
                    message: errorMessage,
                    error: error instanceof Error ? error : new Error(errorMessage),
                };
                setResponse(errorResponse);
            }
        });
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-8">
                <div className="grid gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Enter the staff members basic details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter first name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter last name"
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
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <PhoneInput
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter phone number"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <FormControl>
                                            <GenderSelector
                                                {...field}
                                                isDisabled={isSubmitting}
                                                label="Select staff gender"
                                                placeholder="Select gender"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nationality</FormLabel>
                                        <FormControl>
                                            <CountrySelector
                                                {...field}
                                                isDisabled={isSubmitting}
                                                label="Select staff nationality"
                                                placeholder="Select nationality"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </CardContent>
                    </Card>

                    {/* Work Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Details</CardTitle>
                            <CardDescription>
                                Staff role and department information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter job title"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <FormControl>
                                            <DepartmentSelector
                                                {...field}
                                                isDisabled={isSubmitting}
                                                placeholder="Select department"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <FormControl>
                                            <RoleSelector
                                                {...field}
                                                isDisabled={isSubmitting}
                                                placeholder="Select role"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* System Access */}
                    <Card>
                        <CardHeader>
                            <CardTitle>System Access</CardTitle>
                            <CardDescription>
                                Manage staff access permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="dashboardAccess"
                                    render={({ field }) => (
                                        <FormItem
                                            className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Dashboard Access</FormLabel>
                                                <FormDescription>
                                                    Allow access to admin dashboard
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked);
                                                        setIsDashboardEnabled(checked);
                                                    }}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="posAccess"
                                    render={({ field }) => (
                                        <FormItem
                                            className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">POS Access</FormLabel>
                                                <FormDescription>
                                                    Allow access to POS system
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {isDashboardEnabled && (
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isSubmitting}
                                                    type="email"
                                                    value={field.value ?? ''}
                                                    placeholder="Enter email address"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Required for dashboard login
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Emergency Contact</CardTitle>
                            <CardDescription>
                                Contact person in case of emergency
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="emergencyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter contact name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergencyNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Phone</FormLabel>
                                        <FormControl>
                                            <PhoneInput
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter contact number"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergencyRelationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relationship</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter relationship"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Notes</CardTitle>
                            <CardDescription>
                                Any other relevant information about the staff member
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                disabled={isSubmitting}
                                                placeholder="Enter any additional notes"
                                                className="min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex h-5 items-center space-x-4">
                    <CancelButton />
                    <Separator orientation="vertical" />
                    <SubmitButton
                        isPending={isSubmitting}
                        label={item ? "Update staff details" : "Create staff"}
                    />
                </div>
            </form>
        </Form>
    );
};

export default StaffForm;
