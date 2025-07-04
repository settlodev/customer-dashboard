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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema } from "@/types/stock-intake/schema";
import { createStockIntake, updateStockIntake } from "@/lib/actions/stock-intake-actions";

import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { useSearchParams } from 'next/navigation'
import { FormError } from "@/components/widgets/form-error";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";
import DateTimePicker from "@/components/widgets/datetimepicker";
import SupplierSelector from "@/components/widgets/supplier-selector";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
function StockIntakeForm({ item }: { item: StockIntake | null | undefined }) {

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [orderDate, setOrderDate] = useState<Date | undefined>(
        item?.orderDate ? new Date(item.orderDate) : undefined
    );
    const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
        item?.deliveryDate ? new Date(item.deliveryDate) : undefined
    );
    const [batchExpiryDate, setBatchExpiryDate] = useState<Date | undefined>(
        item?.batchExpiryDate ? new Date(item.batchExpiryDate) : undefined
    );
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams()
    const stockVariantId = searchParams.get('stockItem')

    const form = useForm<z.infer<typeof StockIntakeSchema>>({
        resolver: zodResolver(StockIntakeSchema),
        defaultValues: item ? item : { 
            status: true,
            // If stockVariantId exists, set it as the default stock variant
            ...(stockVariantId ? { stockVariant: stockVariantId } : {})
        },
    });

    useEffect(() => {
        if (stockVariantId) {
            form.setValue('stockVariant', stockVariantId);
        }
    }, [stockVariantId, form]);


    const onInvalid = useCallback(
        (errors: any) => {
            console.log("These errors occurred:", errors);
            toast({
                variant: "destructive",
                title: "Uh oh! something went wrong",
                description: errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof StockIntakeSchema>) => {
        if (deliveryDate && orderDate && deliveryDate < orderDate) {
            setError("Delivery date cannot be before order date.");
            return;
        }
        const updatedValues = {
            value: values.value
        };
        startTransition(() => {
            if (item) {
                updateStockIntake(item.id, updatedValues).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        router.push("/stock-intakes");
                    }
                });
            } else {
                createStockIntake(values,)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stock-intakes");
                        }
                    })
                    .catch((err) => {
                        console.log("Error while creating stock intake: ", err);
                    });
            }
        });
    };

    const handleTimeChange = (type: "hour" | "minutes", value: string) => {
        if (!orderDate || !setOrderDate || !setDeliveryDate) return;

        const newDate = new Date(orderDate);
        const newDeliveryDate = new Date(orderDate);
        const newBatchExpiryDate = new Date(orderDate);

        if (type === "hour") {
            newDate.setHours(Number(value));
            newDeliveryDate.setHours(Number(value));
            newBatchExpiryDate.setHours(Number(value));
        } else if (type === "minutes") {
            newDate.setMinutes(Number(value));
            newDeliveryDate.setMinutes(Number(value));
            newBatchExpiryDate.setMinutes(Number(value));
        }

        setOrderDate(newDate);
        setDeliveryDate(newDeliveryDate)
        setBatchExpiryDate(newBatchExpiryDate)
    };

    const handleDateSelect = (date: Date) => {
        setOrderDate(date);
        setDeliveryDate(date);
        setBatchExpiryDate(date);
    };
    const validateDates = (date: Date) => {
        if (orderDate && date < orderDate) {
            setError("Delivery date cannot be before the order date.");
            return false;
        }
        setError(undefined);
        return true;
    };

    const handleDeliveryDateSelect = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (validateDates(date) && date <= today) {
            setDeliveryDate(date);
        } else {
            if (date > today) {
                setError("Delivery date cannot exceed today's date.");
                return false;
            }
        }
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-8">
                    <FormError message={error} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="stockVariant"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Stock Item</FormLabel>
                                    <FormControl>
                                        <StockVariantSelector
                                            {...field}
                                            isRequired
                                            isDisabled={!!item || isPending}
                                            placeholder="Select stock item"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Quantity</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            value={field.value || ""}
                                            disabled={!!item || isPending}
                                            placeholder="Enter quantity"
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/,/g, ""); // Remove commas
                                                if (/^\d*$/.test(rawValue)) {
                                                    field.onChange(rawValue ? parseInt(rawValue) : "");
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const formattedValue = Number(e.target.value).toLocaleString();
                                                e.target.value = formattedValue;
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Value</FormLabel>
                                    <FormControl>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            value={field.value || ""}
                                            disabled={isPending}
                                            placeholder="Enter value"
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/,/g, "");
                                                if (/^\d*$/.test(rawValue)) {
                                                    field.onChange(rawValue ? parseInt(rawValue) : "");
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const formattedValue = Number(e.target.value).toLocaleString();
                                                e.target.value = formattedValue;
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="staff"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Staff Member</FormLabel>
                                    <FormControl>
                                        <StaffSelectorWidget
                                            {...field}
                                            isRequired
                                            isDisabled={!!item || isPending}
                                            placeholder="Select staff member"
                                            label="Select staff member"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="orderDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Order Date
                                    </FormLabel>
                                    <DateTimePicker
                                        field={field}
                                        date={orderDate}
                                        setDate={setOrderDate}
                                        handleTimeChange={handleTimeChange}
                                        onDateSelect={handleDateSelect}
                                        maxDate={new Date()}
                                        disabled={!!item}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deliveryDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Delivery Date
                                    </FormLabel>
                                    <DateTimePicker
                                        field={field}
                                        date={deliveryDate}
                                        setDate={setDeliveryDate}
                                        handleTimeChange={handleTimeChange}
                                        onDateSelect={handleDeliveryDateSelect}
                                        minDate={orderDate}
                                        maxDate={new Date()}
                                        disabled={!!item}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="batchExpiryDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Batch Expiry
                                    </FormLabel>
                                    <DateTimePicker
                                        field={field}
                                        date={batchExpiryDate}
                                        setDate={setBatchExpiryDate}
                                        handleTimeChange={handleTimeChange}
                                        onDateSelect={handleDateSelect}
                                        disabled={!!item}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="supplier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">
                                        Supplier <span className="text-sm text-gray-500">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <SupplierSelector
                                            {...field}
                                            isDisabled={!!item || isPending}
                                            placeholder="Select supplier"
                                            label="Select supplier"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {item && (
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <div>
                                            <FormLabel className="font-medium">Status</FormLabel>
                                            <p className="text-sm text-gray-500">
                                                Toggle the current status of this stock intake
                                            </p>
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
                        )}

                    </div>

                    <div className="flex h-5 items-center space-x-4">
                        <CancelButton />
                        <Separator orientation="vertical" />
                        <SubmitButton label={item ? "Update stock intake" : "Record stock intake"} isPending={isPending} />
                    </div>
                </form>
            </Form>
        </>
    );
}

export default StockIntakeForm;
