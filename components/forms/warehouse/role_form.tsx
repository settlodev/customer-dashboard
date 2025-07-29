
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Switch } from "@nextui-org/switch";
import { cn } from "@nextui-org/react";

import {
    Form,
    FormControl,
    FormField,
    FormItem, 
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { FormResponse } from "@/types/types";
import { RoleSchema } from "@/types/roles/schema";
import { FormError } from "@/components/widgets/form-error";
import { Role } from "@/types/roles/type";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createWarehouseRole, updateWarehouseRole } from "@/lib/actions/warehouse/roles-action";

const WarehouseRoleForm = ({ item }: { item: Role | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();

    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof RoleSchema>>({
        resolver: zodResolver(RoleSchema),
        defaultValues: {
            ...item,
        },
    });

    const submitData = (values: z.infer<typeof RoleSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                updateWarehouseRole(item.id, values).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        form.reset();
                        router.push("/warehouse-role");
                    } else if (data && data.responseType === "error") {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: data.message,
                        });
                    }
                });
            } else {
                createWarehouseRole(values).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        form.reset();
                        router.push("/warehouse-role");
                    } else if (data && data.responseType === "error") {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: data.message,
                        });
                    }
                });
            }
        });
    }

    const onInvalid = useCallback(
        (errors: any) => {
            const firstError = Object.values(errors)[0] as any;
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: firstError?.message || "Please fix the form errors and try again",
            });
        },
        [toast]
    );

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {item ? "Edit Warehouse Role" : "Create New Warehouse Role"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {item ? "Update the role information below" : "Set up a new role with the required details"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-8">
                    <Form {...form}>
                        <FormError message={response?.message} />
                        
                        <form className="space-y-6" onSubmit={form.handleSubmit(submitData, onInvalid)}>
                            {/* Role Details Section */}
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Role Information
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Provide the basic information for this warehouse role
                                    </p>
                                </div>

                                {/* Role Name Field */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                Role Name
                                                <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="e.g., Warehouse Manager, Inventory Clerk, Shipping Coordinator"
                                                        className={cn(
                                                            "pl-12 py-3 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600",
                                                            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                                            "transition-all duration-200 ease-in-out",
                                                            "hover:border-gray-400 dark:hover:border-gray-500",
                                                            isPending && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    />
                                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Role Description Field */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Role Description
                                                <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Textarea
                                                        {...field}
                                                        disabled={isPending}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        placeholder="Provide a comprehensive description of the role responsibilities, requirements, and key duties..."
                                                        className={cn(
                                                            "pl-12 pr-4 py-3 min-h-[120px] bg-gray-50 dark:bg-gray-900",
                                                            "border-gray-300 dark:border-gray-600",
                                                            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                                            "transition-all duration-200 ease-in-out",
                                                            "hover:border-gray-400 dark:hover:border-gray-500",
                                                            "resize-vertical",
                                                            isPending && "opacity-50 cursor-not-allowed"
                                                        )}
                                                        rows={5}
                                                    />
                                                    <div className="absolute left-4 top-4">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <div className="flex justify-between items-center">
                                                <FormMessage />
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {field.value?.length || 0} characters
                                                </div>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-4 sm:ml-auto">
                                    <CancelButton />
                                    <Separator orientation="vertical" className="h-6" />
                                    <SubmitButton 
                                        label={item ? "Update Role" : "Create Role"} 
                                        isPending={isPending} 
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

            </div>
        </div>
    );
};

export default WarehouseRoleForm;