
"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockIntake } from "@/types/stock-intake/type";

import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";
import { Calendar, Clock, DollarSign, Plus, Trash2, Package, TrendingUp, Copy } from "lucide-react";
import { useSearchParams } from 'next/navigation'
import { FormError } from "@/components/widgets/form-error";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import { createStockIntakeForWarehouse} from "@/lib/actions/warehouse/stock-intake-actions";
import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
import StockVariantSelectorForWarehouse from "@/components/widgets/warehouse/stock-variant-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { NumericFormat } from "react-number-format";

// Updated schemas for multiple items
const StockIntakeItemSchema = z.object({
    stockVariant: z.string({ message: "Please select stock item" }).uuid(),
    quantity: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val);
            }
            return val;
        },
        z.number({ message: "Quantity is required" })
            .nonnegative({ message: "Quantity cannot be negative" })
            .gt(0, { message: "Quantity cannot be zero" })
    ),
    value: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseFloat(val);
            }
            return val;
        },
        z.number({ message: "Value of inventory is required" })
            .nonnegative({ message: "Value cannot be negative" })
            .gt(0, { message: "Value cannot be zero" })
    ),
    batchExpiryDate: z.string({ required_error: "Batch expiry date is required" }).optional(),
    orderDate: z.string({ required_error: "Order date is required" }),
    deliveryDate: z.string({ required_error: "Delivery date is required" }),
    staff: z.string({ message: "Please select a staff" }).uuid(),
    supplier: z.string().uuid().optional(),
    purchasePaidAmount: z.number().optional(),
    trackPurchase: z.boolean().optional(),
}).refine((data) => {
    
    if (data.trackPurchase && !data.supplier) {
        return false;
    }
    return true;
}, {
    message: "Supplier is required when tracking purchase",
    path: ["supplier"], 
});

const MultiStockIntakeSchema = z.object({
    stockIntakes: z.array(StockIntakeItemSchema).min(1, { message: "At least one stock intake must be added" }),
    status: z.boolean().optional(),
});

function WarehouseStockIntakeForm({ item }: { item: StockIntake | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [, setResponse] = useState<FormResponse | undefined>();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const stockVariantId = searchParams.get('stockItem');

    const form = useForm<z.infer<typeof MultiStockIntakeSchema>>({
        resolver: zodResolver(MultiStockIntakeSchema),
        defaultValues: {
            status: true,
            stockIntakes: stockVariantId 
                ? [{
                    stockVariant: stockVariantId,
                    quantity: 1,
                    value: 0,
                    orderDate: new Date().toISOString(),
                    deliveryDate: new Date().toISOString(),
                    batchExpiryDate: undefined,
                    staff: "",
                    supplier: undefined,
                    purchasePaidAmount: undefined,
                    trackPurchase: false,
                }]
                : [{
                    stockVariant: "",
                    quantity: 1,
                    value: 0,
                    orderDate: new Date().toISOString(),
                    deliveryDate: new Date().toISOString(),
                    batchExpiryDate: undefined,
                    staff: "",
                    supplier: undefined,
                    purchasePaidAmount: undefined,
                    trackPurchase: false,
                }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "stockIntakes",
    });

    const addStockIntake = () => {
        append({
            stockVariant: "",
            quantity: 1,
            value: 0,
            orderDate: new Date().toISOString(),
            deliveryDate: new Date().toISOString(),
            batchExpiryDate: undefined,
            staff: "",
            supplier: undefined,
            purchasePaidAmount: undefined,
            trackPurchase: false,
        });
    };

    const duplicateStockIntake = (index: number) => {
        const currentIntake = form.getValues(`stockIntakes.${index}`);
        append({
            ...currentIntake,
            stockVariant: "", 
        });
    };

    const removeStockIntake = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    const onInvalid = useCallback(
        (errors: any) => {
            console.log("These errors occurred:", errors);
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please check all required fields and try again.",
            });
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof MultiStockIntakeSchema>) => {
        console.log("Starting submitData with values:", values);

        // Transform data to array format expected by API
        const payload = values.stockIntakes.map(intake => ({
            quantity: intake.quantity,
            value: intake.value,
            batchExpiryDate: intake.batchExpiryDate,
            deliveryDate: intake.deliveryDate,
            orderDate: intake.orderDate,
            stockVariant: intake.stockVariant,
            staff: intake.staff,
            supplier: intake.supplier,
            ...(intake.trackPurchase && intake.purchasePaidAmount && { 
                purchasePaidAmount: intake.purchasePaidAmount 
            })
        }));

        startTransition(() => {
            if (item) {
                // For updates, we'll need to handle this differently since it's now multiple items
                toast({
                    variant: "destructive",
                    title: "Update Not Supported",
                    description: "Updating multiple stock intakes is not currently supported.",
                });
                return;
            } else {
                createStockIntakeForWarehouse(payload)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/warehouse-stock-intakes");
                        }
                    })
                    .catch((err) => {
                        console.log("Error while creating stock intake: ", err);
                    });
            }
        });
    };

    const validateDates = (orderDate: string, deliveryDate: string) => {
        const order = new Date(orderDate);
        const delivery = new Date(deliveryDate);
        
        if (delivery < order) {
            setError("Delivery date cannot be before order date.");
            return false;
        }
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (delivery > today) {
            setError("Delivery date cannot exceed today's date.");
            return false;
        }
        
        setError(undefined);
        return true;
    };

   
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {item ? "Update Stock Intake" : "New Stock Intake"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Record multiple stock items received into the warehouse
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
                    <FormError message={error} />

                    {/* Stock Intakes Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Stock Intake Items</CardTitle>
                            <Button
                                type="button"
                                onClick={addStockIntake}
                                disabled={isPending}
                                className="flex items-center space-x-2"
                                size="sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Item</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="border border-gray-200 rounded-lg p-6 space-y-6 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                            <Package className="w-4 h-4" />
                                            <span>Stock Intake #{index + 1}</span>
                                        </h4>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => duplicateStockIntake(index)}
                                                disabled={isPending}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeStockIntake(index)}
                                                    disabled={isPending}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.stockVariant`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Stock Item *</FormLabel>
                                                    <FormControl>
                                                        <StockVariantSelectorForWarehouse
                                                            {...field}
                                                            isRequired
                                                            isDisabled={isPending}
                                                            placeholder="Select stock item"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Quantity *</FormLabel>
                                                    <FormControl>
                                                        <NumericFormat
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Value *</FormLabel>
                                                    <FormControl>
                                                        <NumericFormat
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            value={field.value}
                                                            onValueChange={(values) => {
                                                                field.onChange(Number(values.value));
                                                            }}
                                                            thousandSeparator={true}
                                                            placeholder="Enter value of item"
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Purchase Tracking */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.trackPurchase`}
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-medium">
                                                        Track purchase amount for this item
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch(`stockIntakes.${index}.trackPurchase`) && (
                                            <FormField
                                                control={form.control}
                                                name={`stockIntakes.${index}.purchasePaidAmount`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            Purchase Amount
                                                        </FormLabel>
                                                        <FormControl>
                                                            <NumericFormat
                                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                value={field.value}
                                                                onValueChange={(values) => {
                                                                    field.onChange(Number(values.value));
                                                                }}
                                                                thousandSeparator={true}
                                                                placeholder="Enter purchase amount"
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Date Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.orderDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Order Date *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                            max={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.deliveryDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Delivery Date *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                            min={form.watch(`stockIntakes.${index}.orderDate`)}
                                                            max={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.batchExpiryDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Batch Expiry (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                            {...field}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Personnel & Supplier */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`stockIntakes.${index}.staff`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Staff Member *</FormLabel>
                                                    <FormControl>
                                                        <WarehouseStaffSelectorWidget
                                                            {...field}
                                                            isRequired
                                                            isDisabled={isPending}
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
                                            name={`stockIntakes.${index}.supplier`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">
                                                        Supplier <span className="text-sm text-gray-500">(optional)</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <SupplierSelector
                                                            {...field}
                                                            isDisabled={isPending}
                                                            placeholder="Select supplier"
                                                            label="Select supplier"
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

                    {/* Status Toggle for Updates */}
                    {item && (
                        <Card>
                            <CardContent className="pt-6">
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
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <CancelButton />
                        <SubmitButton 
                            label={item ? "Update stock intake" : "Record stock intakes"} 
                            isPending={isPending} 
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default WarehouseStockIntakeForm;