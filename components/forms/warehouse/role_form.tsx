"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { WarehousePrivilegeItem } from "@/types/types";
import { WarehouseRoleSchema } from "@/types/roles/schema";
import { WarehouseRole } from "@/types/roles/type";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createWarehouseRole, updateWarehouseRole } from "@/lib/actions/warehouse/roles-action";
import _ from "lodash";
import { searchWarehousePrivilegesSection } from "@/lib/actions/privileges-actions";

const WarehouseRoleForm = ({ item }: { item: WarehouseRole | null | undefined }) => {

    const [isPending, startTransition] = useTransition();
    const [privileges, setPrivileges] = useState<string[]>([]);
    const [sections, setSections] = useState<WarehousePrivilegeItem[]>([]);
    const [isLoadingSections, setIsLoadingSections] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    // Initialize privileges from item - Fixed to handle the correct property name
    useEffect(() => {
        if (item && item.warehousePrivilegeActions) {
            const myPrivs: string[] = [];
            item.warehousePrivilegeActions.forEach(priv => {
                if (priv.id) {
                    myPrivs.push(priv.id);
                }
            });
            
            setPrivileges(myPrivs);
        }
    }, [item]);

    const form = useForm<z.infer<typeof WarehouseRoleSchema>>({
        resolver: zodResolver(WarehouseRoleSchema),
        defaultValues: {
            name: item?.name || "",
            description: item?.description || "",
            // Add other default values as needed
        },
    });

    const submitData = (values: z.infer<typeof WarehouseRoleSchema>) => {
        if (privileges.length > 0) {
            values.warehousePrivilegeActionIds = _.compact(privileges);
            console.log("Submitting values:", values);

            startTransition(() => {
                if (item) {
                    updateWarehouseRole(item.id, values).then((data) => {
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
        } else {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select at least one privilege",
            });
        }
    }

    const initialized = useRef(false);

    useEffect(() => {
        async function getData() {
            if (!initialized.current) {
                initialized.current = true;
                setIsLoadingSections(true);
                try {
                    const result = await searchWarehousePrivilegesSection();
                    
                    // Handle different response structures - Fixed to handle your API response
                    let sectionsData: WarehousePrivilegeItem[] = [];
                    
                    if (result && result.content && Array.isArray(result.content)) {
                        // Handle paginated response structure
                        // @ts-expect-error - `result.content` is a nested array, but we expect a flat array here
                        sectionsData = result.content;
                    } else if (Array.isArray(result)) {
                        // If the response is directly an array
                        sectionsData = result;
                    }
                    
                    setSections(sectionsData);
                } catch (error) {
                    console.error("Error fetching sections:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load privilege sections",
                    });
                } finally {
                    setIsLoadingSections(false);
                }
            }
        }
        getData();
    }, [toast]);

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

    const selectAction = (action_id: string) => {
        setPrivileges(prevPrivileges => {
            const newPrivileges = prevPrivileges.includes(action_id)
                ? prevPrivileges.filter(id => id !== action_id)
                : [...prevPrivileges, action_id];
            return newPrivileges;
        });
    }

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
                        {/* Removed FormError component - using toast notifications instead */}
                        
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
                                                        value={field.value || ""}
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

                                {/* Privileges Section */}
                                <div className="space-y-4">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Select Privileges
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Choose the permissions this role should have ({privileges.length} selected)
                                        </p>
                                    </div>

                                    {isLoadingSections ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            <span className="ml-2 text-gray-500">Loading privileges...</span>
                                        </div>
                                    ) : sections.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No privilege sections found
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {sections.map((section, index) => (
                                                <div 
                                                    key={section.id || index} 
                                                    className="bg-white dark:bg-gray-900 border rounded-lg shadow-sm p-4"
                                                >
                                                    <h5 className="text-md font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">
                                                        {section.name}
                                                    </h5>
                                                    {section.warehousePrivilegeActions && section.warehousePrivilegeActions.length > 0 ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {section.warehousePrivilegeActions.map((action, i) => {
                                                                if (!action.action || !action.id) return null;
                                                                
                                                                // Check if this action is selected by comparing IDs
                                                                const selected = privileges.includes(action.id);
                                                                
                                                                return (
                                                                    <div 
                                                                        key={action.id || i}
                                                                        className={cn(
                                                                            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200",
                                                                            selected 
                                                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 border' 
                                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                                                        )}
                                                                        onClick={() => selectAction(action.id)}
                                                                    >
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={selected} 
                                                                            onChange={(e) => {
                                                                                e.stopPropagation();
                                                                                selectAction(action.id);
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="form-checkbox h-4 w-4 text-emerald-600 rounded 
                                                                                border-gray-300 dark:border-gray-600
                                                                                focus:ring-emerald-500 focus:border-emerald-500
                                                                                checked:bg-emerald-600 
                                                                                checked:border-emerald-600"
                                                                        />
                                                                        <span 
                                                                            className={cn(
                                                                                "text-xs font-medium cursor-pointer",
                                                                                selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
                                                                            )}
                                                                            onClick={() => selectAction(action.id)}
                                                                        >
                                                                            {action.action}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                            No actions available for this section
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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