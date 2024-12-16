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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { Switch } from "@/components/ui/switch";
import { StockIntake } from "@/types/stock-intake/type";
import { StockIntakeSchema } from "@/types/stock-intake/schema";
import { createStockIntake, updateStockIntake } from "@/lib/actions/stock-intake-actions";
import SupplierSelector from "../widgets/supplier-selector";
import DateTimePicker from "../widgets/datetimepicker";
import StaffSelectorWidget from "../widgets/staff_selector_widget";
import StockVariantSelector from "../widgets/stock-variant-selector";
import { NumericFormat } from "react-number-format";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";

function StockIntakeForm({ item }: { item: StockIntake | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success,] = useState<string | undefined>("");
   
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



    const form = useForm<z.infer<typeof StockIntakeSchema>>({
        resolver: zodResolver(StockIntakeSchema),
        defaultValues: item ? item : { status: true },
    });


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
        startTransition(() => {
            if (item) {
                updateStockIntake(item.id, values).then((data) => {
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
    return (
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <div className="flex gap-10">
                <div className="flex-1">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(submitData, onInvalid)}
                            className={`gap-1`}>
                            <div>
                                <FormError message={error} />
                                <FormSuccess message={success} />

                                <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                    {/* <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="stock"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Stock </FormLabel>
                                                        <FormControl>
                                                            <StockSelector
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                    handleStockChange(value);
                                                                }}
                                                                onBlur={field.onBlur}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="Stock"
                                                                placeholder="Select stock"
                                                                stocks={stocks}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div> */}
                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="stockVariant"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Stock Item</FormLabel>
                                                        <FormControl>
                                                            <StockVariantSelector
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                isRequired
                                                                isDisabled={isPending}
                                                                label="Stock item"
                                                                placeholder="Select stock Item"
                                                                // disabledValues={disabledValues}
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
                                                            <NumericFormat
                                                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                value={field.value}
                                                                disabled={isPending}
                                                                placeholder="Enter stock intake quantity"
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



                                    <div className="mt-4 flex">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="value"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Value / Amount</FormLabel>
                                                        <FormControl>

                                                        <NumericFormat
                                                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                value={field.value}
                                                                disabled={isPending}
                                                                placeholder="Enter stock intake value"
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
                                </div>

                                <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                    <div className="grid gap-2">
                                        <FormField
                                            control={form.control}
                                            name="orderDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date of Order</FormLabel>
                                                    <DateTimePicker
                                                        field={field}
                                                        date={orderDate}
                                                        setDate={setOrderDate}
                                                        handleTimeChange={handleTimeChange}
                                                        onDateSelect={handleDateSelect}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <FormField
                                            control={form.control}
                                            name="deliveryDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Delivery Date</FormLabel>
                                                    <DateTimePicker
                                                        field={field}
                                                        date={deliveryDate}
                                                        setDate={setDeliveryDate}
                                                        handleTimeChange={handleTimeChange}
                                                        onDateSelect={handleDateSelect}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-4">

                                    <div className="grid gap-2">
                                        <FormField
                                            control={form.control}
                                            name="batchExpiryDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Batch Expiry Date</FormLabel>
                                                    <DateTimePicker
                                                        field={field}
                                                        date={batchExpiryDate}
                                                        setDate={setBatchExpiryDate}
                                                        handleTimeChange={handleTimeChange}
                                                        onDateSelect={handleDateSelect}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {item && (
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                defaultValue={false}
                                                render={({ field }) => (
                                                    <FormItem
                                                        className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                        <FormLabel className="flex-1">Stock Intake Status</FormLabel>
                                                        <FormControl className="self-end">
                                                            <Switch
                                                                checked={field.value !== undefined ? field.value : false}
                                                                onCheckedChange={field.onChange}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}



                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-2">

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
                                    <FormField
                                        control={form.control}
                                        name="supplier"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <SupplierSelector
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Supplier"
                                                        placeholder="Select supplier"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
                                <CancelButton />
                                <Separator orientation="vertical" />
                                <SubmitButton
                                    isPending={isPending}
                                    label={item ? "Update stock intake" : "Save stock intake"}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

            </div>
        </div>
    )
}

export default StockIntakeForm;
