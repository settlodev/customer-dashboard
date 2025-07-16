"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Staff} from "@/types/staff";
import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast"
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { createStaffFromWarehouse, updateStaffFomWarehouse } from "@/lib/actions/warehouse/staff-actions";
import { StaffWarehouseSchema } from "@/types/warehouse/staff/schema";
import WarehouseRoleSelector from "@/components/widgets/warehouse/role-selector";

interface StaffFormProps {
    item: Staff | null | undefined;
    onFormSubmitted?: (response: FormResponse) => void;
}

const WarehouseStaffForm: React.FC<StaffFormProps> = ({
    item,
    onFormSubmitted,
}) => {

    
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();

    const form = useForm<z.infer<typeof StaffWarehouseSchema>>({
        resolver: zodResolver(StaffWarehouseSchema),
        defaultValues: {
            ...item,
            status: item ? item.status : true,
            // warehouseRole: item ? item.warehouseRole : null
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

    const submitData = async (values: z.infer<typeof StaffWarehouseSchema>) => {
        setResponse(undefined);
    
        startTransition(async () => {
            try {
                let result: FormResponse | void;
                
                if (item) {
                    result = await updateStaffFomWarehouse(item.id, values);
                } else {
                    result = await createStaffFromWarehouse(values);
                }
    
                if (result) {
                    setResponse(result);
                    
                    if (result.responseType === "success") {

                        toast({
                            title: "Success!",
                            description: result.message,
                        });
                        onFormSubmitted?.(result);
                        form.reset();
                        
                        form.setValue("status", false);
                        window.location.href = "/warehouse-staff";
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
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
                                                className="w-full border border-gray-300 rounded-md"
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
                                name="warehouseRole"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <FormControl>
                                            <WarehouseRoleSelector
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

export default WarehouseStaffForm;
