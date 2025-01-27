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
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { NumericFormat } from "react-number-format";
import { Textarea } from "../ui/textarea";
import { StockTransfer } from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { createStockTransfer } from "@/lib/actions/stock-transfer-actions";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { Location } from "@/types/location/type";
import LocationSelector from "../widgets/location-selector";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import { StockVariant } from "@/types/stockVariant/type";
import StockVariantSelector from "../widgets/stock-variant-selector";

function StockTransferForm({ item }: { item: StockTransfer | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [, setStocks] = useState<Stock[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedVariant,] = useState<StockVariant>();


    useEffect(() => {
        const getData = async () => {
            try {
                const [stockResponse, locationResponse] = await Promise.all([
                    fetchStock(),
                    fetchAllLocations(),
                ]);
                setStocks(stockResponse);
                setLocations(locationResponse || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        getData();
    }, []);


    const form = useForm<z.infer<typeof StockTransferSchema>>({
        resolver: zodResolver(StockTransferSchema),
        defaultValues: {
            ...item,
            status: true,

        },
    });

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

    const submitData = (values: z.infer<typeof StockTransferSchema>) => {
        startTransition(() => {
            if (item) {
                console.log("Update logic for existing stock modification");
            } else {
                createStockTransfer(values)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stock-transfers");
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
                                <FormField
                                    control={form.control}
                                    name="stockVariant"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stock Item</FormLabel>
                                            <FormControl>
                                            <StockVariantSelector
                                                {...field}
                                                value={field.value ?? ""}
                                                isDisabled={isPending}
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
                                                name="toLocation"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>To Location</FormLabel>
                                                        <FormControl>
                                                            <LocationSelector
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="To Location"
                                                                placeholder="Select to location"
                                                                locations={locations.filter(location => location.id !== form.getValues("fromLocation"))}
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
                                        name="staff"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Staff</FormLabel>
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
                                        label={item ? "Update Stock Modification" : "Transfer Stock"}
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

export default StockTransferForm;
