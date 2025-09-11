"use client";

import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { NumericFormat } from "react-number-format";
import { StockModification } from "@/types/stock-modification/type";
import { StockModificationSchema } from "@/types/stock-modification/schema";
import { createStockModification } from "@/lib/actions/stock-modification-actions";
import { reasonForStockModification } from "@/types/enums";
import { FormResponse } from "@/types/types";
import { useRouter, useSearchParams } from "next/navigation";
import SubmitButton from "@/components/widgets/submit-button";
import CancelButton from "@/components/widgets/cancel-button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";


function StockModificationForm({ item }: { item: StockModification | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [, setStocks] = useState<Stock[]>([]);
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();

    const searchParams = useSearchParams()
    const stockVariantId = searchParams.get('stockItem')


    const reasons: { id: string; label: string }[] = [
        { id: reasonForStockModification.DAMAGE, label: "Damage" },
        { id: reasonForStockModification.INTERNALUSE, label: "Internal Use" },
        { id: reasonForStockModification.INVENTORYRECOUNT, label: "Inventory Recount" },
        { id: reasonForStockModification.THEFT, label: "Theft" },
    ];


    useEffect(() => {
        const getData = async () => {
            try {
                const [stockResponse] = await Promise.all([
                    fetchStock(),
                    fetchAllStaff(),
                ]);
                setStocks(stockResponse);
            } catch (error) {
                console.error("Error fetching stocks:", error);
            }
        };
        getData();
    }, []);

   

    const form = useForm<z.infer<typeof StockModificationSchema>>({
        resolver: zodResolver(StockModificationSchema),
        defaultValues: {
            ...item,
            status: true,
            reason: item?.reason || reasonForStockModification.DAMAGE,
            ...(stockVariantId ? { stockVariant: stockVariantId } : {})
        },
    });

    const onInvalid = useCallback(
        (errors: any) => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong",
                description: errors.message || "Please try again later.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof StockModificationSchema>) => {

        startTransition(() => {
            if (item) {
                console.log("Update logic for existing stock modification");
            } else {
                createStockModification(values)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stock-modifications");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating stock modification:", err);
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
                                                isDisabled={isPending || false}
                                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="lg:grid grid-cols-2 items-center gap-4 mt-2">
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

                                    {/* staff */}
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

                                <div className="mt-4 grid lg:grid-cols-2 gap-4">
                            
                                    {/* Reason for Modification */}
                                   <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Reason</FormLabel>
                                                <FormDescription>
                                                    Select the reason for stock modification
                                                </FormDescription>
                                                <FormControl>
                                                    <RadioGroup
                                                        value={field.value || ""}
                                                        onValueChange={field.onChange}
                                                        className="grid grid-cols-2 space-y-2 items-center justify-center"
                                                    >
                                                        {reasons.map((item: any) => (
                                                            <FormItem
                                                                key={item.id}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <FormControl>
                                                                    <RadioGroupItem value={item.id} />
                                                                </FormControl>
                                                                <FormLabel>{item.label}</FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Comment */}
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
                                        label={item ? "Update Stock" : "Modify Stock"}
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

export default StockModificationForm;