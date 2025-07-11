"use client";

import { useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";

import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";

import StaffSelectorWidget from "../widgets/staff_selector_widget";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { Location } from "@/types/location/type";
import LocationSelector from "../widgets/location-selector";
import { FormResponse } from "@/types/types";
import { useRouter, useSearchParams } from "next/navigation";
import { StockVariant } from "@/types/stockVariant/type";

import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { StockRequestSchema } from "@/types/stock-request/schema";
import { createStockRequest, updateStockRequest } from "@/lib/actions/request-actions";
import WarehouseSelector from "../widgets/warehouse-selector";
import WarehouseStockVariantSelector from "../widgets/warehouse-stock-variant-selector";

function StockRequestForm({ item }: { item: StockRequests | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [locations, setLocations] = useState<Location[]>([]);
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedVariant,] = useState<StockVariant>();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

    const searchParams = useSearchParams()
    const stockVariantId = searchParams.get('stockItem')

    useEffect(() => {
        const getData = async () => {
            try {
                const locationResponse= await fetchAllLocations();
                setLocations(locationResponse || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        getData();
    }, []);

    const form = useForm<z.infer<typeof StockRequestSchema>>({
        resolver: zodResolver(StockRequestSchema),
        defaultValues: {
            ...item,
            status: true,
            ...(stockVariantId ? { stockVariant: stockVariantId } : {})
        },
    });

    // Watch for warehouse changes
    const watchedWarehouse = form.watch("toWarehouse");
    
    useEffect(() => {
        if (watchedWarehouse && watchedWarehouse !== selectedWarehouseId) {
            setSelectedWarehouseId(watchedWarehouse);
            // Reset the stock variant selection when warehouse changes
            form.setValue("warehouseStockVariant", "");
        }
    }, [watchedWarehouse, selectedWarehouseId, form]);

    const onInvalid = useCallback(
        (errors: any) => {
            console.error("Validation errors:", errors );
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong",
                description: errors.message || "Please try again later.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof StockRequestSchema>) => {
        startTransition(() => {
            if (item) {
                // console.log("Updating existing stock transfer with ID:", item);
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
                        console.error("Error creating stock transfer:", err);
                    });
            }
        });
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <div className="flex gap-10">
                <div className="flex-1">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(submitData, onInvalid)}
                            className="gap-1"
                        >
                            <div>
                                <FormError message={error} />
                                <FormSuccess message={success} />
                             
                                <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="fromLocation"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>From Location </FormLabel>
                                                        <FormControl>
                                                            <LocationSelector
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="Location"
                                                                placeholder="Select location"
                                                                locations={locations}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="toWarehouse"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Warehouse </FormLabel>
                                                        <FormControl>
                                                            <WarehouseSelector
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="From Warehouse"
                                                                placeholder="Select from warehouse"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                    <FormField
                                        control={form.control}
                                        name="warehouseStockVariant"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stock Item</FormLabel>
                                                <FormControl>
                                                    <WarehouseStockVariantSelector
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        isDisabled={isPending || !selectedWarehouseId}
                                                        warehouseId={selectedWarehouseId}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {selectedVariant && (
                                        <div className=" flex flex-col mt-2 border border-emerald-300 animate-bounce rounded-md py-2 px-3 cursor-pointer hover:animate-none">
                                            <p className="text-sm"><span className=" uppercase font-bold text-emerald-500 mr-2">note:</span>The transfer can not exceed the current available quantity</p>
                                            <p className="text-sm">Current Available Quantity: {Intl.NumberFormat().format(selectedVariant.currentAvailable)}</p>
                                            <p className="text-sm">Current Average Value: {Intl.NumberFormat().format(selectedVariant.currentTotalValue)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="quantity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Quantity</FormLabel>
                                                        <FormControl>
                                                            <FormControl>
                                                                <NumericFormat
                                                                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                    value={field.value}
                                                                    disabled={isPending}
                                                                    placeholder="Enter stock quantity"
                                                                    thousandSeparator={true}
                                                                    allowNegative={false}
                                                                    onValueChange={(values) => {
                                                                        const rawValue = Number(values.value.replace(/,/g, ""));
                                                                        field.onChange(rawValue);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="locationStaffRequested"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Staff Requesting</FormLabel>
                                                        <FormControl>
                                                            <StaffSelectorWidget
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="staff"
                                                                placeholder="Select staff"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid lg:grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="comment"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Comment</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Your comment"
                                                        {...field}
                                                        disabled={isPending}
                                                        maxLength={400}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center space-x-4 mt-4">
                                    <CancelButton />
                                    <Separator orientation="vertical" />
                                    <SubmitButton
                                        isPending={isPending}
                                        label={item ? "Update Stock Request" : "Request Stock"}
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default StockRequestForm;