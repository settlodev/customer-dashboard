"use client";

import React, {useCallback, useState} from "react";
import {useForm, useFieldArray, FieldErrors} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { CardContent, Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "../widgets/form-error";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { createStock, updateStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { StockSchema } from "@/types/stock/schema";
import { useTransition } from "react";
import { FormResponse } from "@/types/types";

type StockFormProps = {
    item: Stock | null | undefined;
};

export default function StockForm({ item }: StockFormProps) {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();

    const form = useForm<z.infer<typeof StockSchema>>({
        resolver: zodResolver(StockSchema),
        defaultValues: {
            name: item?.name || "",
            description: item?.description || "",
            status: item?.status ?? true,
            stockVariants: item?.stockVariants.map(variant => ({
                name: variant.name,
                startingQuantity: variant.startingQuantity,
                startingValue: variant.startingValue,
                alertLevel: variant.alertLevel,
                imageOption: variant.imageOption || ""
            })) || [{
                name: "",
                startingQuantity: 0,
                startingValue: 0,
                alertLevel: 0,
                imageOption: ""
            }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "stockVariants"
    });

    const {toast} = useToast();

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("errors", errors);
        },
        [toast]
    );

    const submitData = (values: z.infer<typeof StockSchema>) => {
        console.log('Starting submitData with values:', values);
        setResponse(undefined);

        startTransition(() => {
            console.log('Inside startTransition, item:', item);

            if (item) {
                console.log('Updating existing stock with ID:', item.id);
                updateStock(item.id, values)
                    .then((data) => {
                        console.log('Update stock response:', data);
                        if (data) setResponse(data);
                    })
                    .catch((error) => {
                        console.error('Error updating stock:', error);
                    });
            } else {
                console.log('Creating new stock');
                createStock(values)
                    .then((data) => {
                        console.log('Create stock response:', data);
                        if (data) setResponse(data);
                    })
                    .catch((error) => {
                        console.error('Error creating stock:', error);
                    });
            }
        });

        console.log('Completed startTransition');
    };

    const isFieldReadOnly = (index: number): boolean => {
        return Boolean(item && index < (item.stockVariants?.length || 0));
    };

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
                <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">
                    {/* Left Column - Basic Information */}
                    <Card className="order-1 xl:order-none md:col-span-1">
                        <CardContent className="pt-6 space-y-6">
                            {/* Basic Information section remains unchanged */}
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Stock Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter stock name"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter a unique name for this stock item
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter stock description"
                                                        {...field}
                                                        disabled={isPending}
                                                        className="resize-none min-h-[120px]"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Provide additional details about the stock item
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Status Switch */}
                            {item && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({field}) => (
                                        <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <FormLabel>Stock Status</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    {field.value ? "Active" : "Inactive"}
                                                </div>
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

                            {/* Action Buttons */}
                            <div className="flex h-5 items-center space-x-4">
                                <CancelButton/>
                                <Separator orientation="vertical"/>
                                <SubmitButton
                                    isPending={isPending}
                                    label={item ? "Update stock" : "Create stock"}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column - Variants */}
                    <Card className="order-2 xl:order-none md:col-span-1 xl:col-span-2">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Stock Variants</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add at least one variant for this stock item
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({
                                        name: "",
                                        startingQuantity: 0,
                                        startingValue: 0,
                                        alertLevel: 0,
                                        imageOption: ""
                                    })}
                                    disabled={isPending}
                                >
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Add Variant
                                </Button>
                            </div>

                            <div className="space-y-6 overflow-y-auto pr-2">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="p-4 rounded-lg border bg-card"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`stockVariants.${index}.name`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Variant Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter variant name"
                                                                {...field}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`stockVariants.${index}.startingQuantity`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Initial Quantity</FormLabel>
                                                        <FormControl>
                                                            <NumericFormat
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
                                                                value={field.value}
                                                                onValueChange={(values) => {
                                                                    field.onChange(Number(values.value));
                                                                }}
                                                                thousandSeparator={true}
                                                                placeholder="Enter quantity"
                                                                disabled={isPending || isFieldReadOnly(index)}
                                                                readOnly={isFieldReadOnly(index)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`stockVariants.${index}.startingValue`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Starting Value</FormLabel>
                                                        <FormControl>
                                                            <NumericFormat
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted"
                                                                value={field.value}
                                                                onValueChange={(values) => {
                                                                    field.onChange(Number(values.value));
                                                                }}
                                                                thousandSeparator={true}
                                                                placeholder="Enter value"
                                                                disabled={isPending || isFieldReadOnly(index)}
                                                                readOnly={isFieldReadOnly(index)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`stockVariants.${index}.alertLevel`}
                                                render={({field}) => (
                                                    <div className="flex gap-2 items-start">
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Alert Level</FormLabel>
                                                            <FormControl>
                                                                <NumericFormat
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                    value={field.value}
                                                                    onValueChange={(values) => {
                                                                        field.onChange(Number(values.value));
                                                                    }}
                                                                    thousandSeparator={true}
                                                                    placeholder="Set minimum stock level"
                                                                    disabled={isPending}
                                                                />
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1 || isPending}
                                                            className="mt-8"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500"/>
                                                        </Button>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
