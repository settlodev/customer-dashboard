"use client";

import { useFieldArray, useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";

import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";

import StaffSelectorWidget from "../widgets/staff_selector_widget";
import { Location } from "@/types/location/type";
import { FormResponse } from "@/types/types";
import { useRouter, useSearchParams } from "next/navigation";

import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { StockRequestSchema } from "@/types/stock-request/schema";
import { createStockRequest, updateStockRequest } from "@/lib/actions/request-actions";
import WarehouseSelector from "../widgets/warehouse-selector";
import WarehouseStockVariantSelector from "../widgets/warehouse-stock-variant-selector";
import { Package, Plus,Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

function StockRequestForm({ item }: { item: StockRequests | null | undefined }) {


    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
        item?.toWarehouse || ""
    );

    const searchParams = useSearchParams();
    const stockVariantId = searchParams.get('stockItem');

    const form = useForm<z.infer<typeof StockRequestSchema>>({
        resolver: zodResolver(StockRequestSchema),
        defaultValues: {
            // Handle existing item (edit mode)
            ...(item ? {
                fromLocation: item.fromLocation,
                toWarehouse: item.toWarehouse,
                locationStaffRequested: item.locationStaffRequested,
                comment: item.comment || "",
                status: true,
                stockRequested: [
                    {
                        warehouseStockVariant: item.warehouseStockVariant,
                        quantity: item.quantity
                    }
                ]
            } : {
                // Handle new item (create mode)
                status: true,
                stockRequested: stockVariantId 
                    ? [{ warehouseStockVariant: stockVariantId, quantity: 1 }]
                    : [{ warehouseStockVariant: "", quantity: 1 }]
            })
        },
    });
    
    useEffect(() => {
        const getData = async () => {
            try {
                const locationResponse = await getCurrentLocation();
                setCurrentLocation(locationResponse);
            
                if (locationResponse && !item) {
                    form.setValue("fromLocation", locationResponse.id);
                }
            } catch (error) {
                console.error("Error fetching current location:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch current location",
                });
            }
        };
        getData();
    }, [form, item, toast]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "stockRequested",
    });

    // Watch for warehouse changes
    const watchedWarehouse = form.watch("toWarehouse");
    
    useEffect(() => {
        if (watchedWarehouse && watchedWarehouse !== selectedWarehouseId) {
            setSelectedWarehouseId(watchedWarehouse);
            
            form.setValue("stockRequested", [{ warehouseStockVariant: "", quantity: 1 }]);
        }
    }, [watchedWarehouse, selectedWarehouseId, form]);

    const addStockItem = () => {
        append({ warehouseStockVariant: "", quantity: 1 });
    };

    const removeStockItem = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    const onInvalid = useCallback(
        (errors: any) => {
            console.error("Validation errors:", errors);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong",
                description: "Please check all fields and try again.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof StockRequestSchema>) => {
        console.log("The values are",values)
        startTransition(() => {
            if (item) {
                updateStockRequest(item.id, values)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stock-requests");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating stock request:", err);
                    });
            } else {
                createStockRequest(values)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stock-requests");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating stock request:", err);
                    });
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {item ? "Update Stock Request" : "New Stock Request"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Request stock items from warehouse to location
                    </p>
                </div>
               
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
                    <FormError message={error} />
                    <FormSuccess message={success} />

                    {/* Request Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Request Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Current Location Display (Read-only) */}
                                <div className="space-y-2">
                                    <FormLabel>From Location</FormLabel>
                                    <div className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50 text-gray-700">
                                        {currentLocation ? currentLocation.name : "Loading current location..."}
                                    </div>
                                    {currentLocation && (
                                        <p className="text-xs text-gray-500">
                                            Current location is automatically selected
                                        </p>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="toWarehouse"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Warehouse *</FormLabel>
                                            <FormControl>
                                                <WarehouseSelector
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    isRequired
                                                    isDisabled={isPending}
                                                    label="Warehouse"
                                                    placeholder="Select warehouse"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="locationStaffRequested"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Requesting Staff *</FormLabel>
                                            <FormControl>
                                                <StaffSelectorWidget
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    isRequired
                                                    isDisabled={isPending}
                                                    label="Staff"
                                                    placeholder="Select staff"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Items Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Stock Items</CardTitle>
                            <Button
                                type="button"
                                onClick={addStockItem}
                                disabled={isPending || !selectedWarehouseId}
                                className="flex items-center space-x-2"
                                size="sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Item</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedWarehouseId && (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Please select a warehouse first to add stock items</p>
                                </div>
                            )}

                            {selectedWarehouseId && fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900">
                                            Item #{index + 1}
                                        </h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeStockItem(index)}
                                                disabled={isPending}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockRequested.${index}.warehouseStockVariant`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stock Item *</FormLabel>
                                                    <FormControl>
                                                        <WarehouseStockVariantSelector
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            isDisabled={isPending}
                                                            warehouseId={selectedWarehouseId}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockRequested.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity *</FormLabel>
                                                    <FormControl>
                                                        <NumericFormat
                                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            value={field.value}
                                                            disabled={isPending}
                                                            placeholder="Enter quantity"
                                                            thousandSeparator={true}
                                                            allowNegative={false}
                                                            onValueChange={(values) => {
                                                                const rawValue = Number(values.value.replace(/,/g, ""));
                                                                field.onChange(rawValue);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Comment Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comment</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any additional notes or comments about this request..."
                                                {...field}
                                                disabled={isPending}
                                                maxLength={400}
                                                className="min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <CancelButton />
                        <SubmitButton
                            isPending={isPending}
                            label={item ? "Update Stock Request" : "Submit Request"}
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default StockRequestForm;