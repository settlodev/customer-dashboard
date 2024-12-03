"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import _ from "lodash";
import { ChevronDownIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { ToastAction } from "../ui/toast";
import { StockSchema } from "@/types/stock/schema";
import { StockVariantSchema } from "@/types/stockVariant/schema";
import { createStock, updateStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { StockFormVariant } from "@/types/stockVariant/type";
import { createStockVariant, deleteStockVariant, updateStockVariant } from "@/lib/actions/stock-variant-actions";
import { NumericFormat } from "react-number-format";
import { FormResponse } from "@/types/types";
import { useRouter } from "next/navigation";

function StockForm({ item }: { item: Stock | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success,] = useState<string | undefined>("");
    const [, setResponse] = useState<FormResponse | undefined>();
    const [variants, setVariants] = useState<StockFormVariant[]>([]);

    const [variantImageUrl, setVariantImageUrl] = useState<string>('');
    const [selectedVariant, setSelectedVariant] = useState<StockFormVariant | null>(null);

    const { toast } = useToast();
    const router = useRouter();
    

    const form = useForm<z.infer<typeof StockSchema>>({
        resolver: zodResolver(StockSchema),
        defaultValues: item ? item : { status: true },
    });

    const variantForm = useForm<z.infer<typeof StockVariantSchema>>({
        resolver: zodResolver(StockVariantSchema),
        defaultValues: {
            name: '',
            startingValue: 0,
            startingQuantity: 0,
            alertLevel: 0,
            imageOption: '',
        },
    });

    useEffect(() => {
        if (item && item.stockVariants) {
            setVariants(item.stockVariants.map(variant => ({
                ...variant,
                name: variant.name,
                startingValue: variant.startingValue,
                startingQuantity: variant.startingQuantity,
                alertLevel: variant.alertLevel,
                imageOption: variant.imageOption
            })));

        }
    }, [item]);

    useEffect(() => {
        if (selectedVariant) {
            variantForm.reset(selectedVariant);
        }
    }, [selectedVariant, variantForm]);

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

    const submitData = (values: z.infer<typeof StockSchema>) => {
        values.stockVariants = variants;
        // if (imageUrl) {
        //     values.imageOption = imageUrl;
        // }

        startTransition(() => {
            if (item) {
                updateStock(item.id, values).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        router.push("/stocks");
                    }
                });
            } else {
                createStock(values)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data && data.responseType === "success") {
                            toast({
                                title: "Success",
                                description: data.message,
                            });
                            router.push("/stocks");
                        }
                    })
                    .catch((err) => {
                        console.log("Error while creating stock: ", err);
                    });
            }
        });
    };

    const saveVariantItem = (values: z.infer<typeof StockVariantSchema>) => {
        if (variantImageUrl) {
            values.imageOption = variantImageUrl ? variantImageUrl : '';
        }
        setVariants([values, ...variants]);
        variantForm.reset();
        setSelectedVariant(null);
    }

    const handleSaveVariant = (values: z.infer<typeof StockVariantSchema>) => {
        if (variantImageUrl) {
            values.imageOption = variantImageUrl;
        }

        const stockId = item?.id;
        console.log("Selected stock ID:", stockId);

        try {
            if (!stockId) {
                console.error("Stock ID is missing");
                return;
            }
            const response = createStockVariant(stockId, values);
            console.log("Variant created response:", response);

            saveVariantItem(values);
            variantForm.reset();
            setSelectedVariant(null);

        } catch (error) {
            console.error("Error creating variant:", error);
        }
    }

    const handleUpdateVariant = async (values: z.infer<typeof StockVariantSchema>) => {

        if (variantImageUrl) {
            values.imageOption = variantImageUrl;
        }

        const variantId = selectedVariant?.id;
        const stockId = item?.id;
        console.log("Selected variant ID:", variantId);

        try {
            if (!variantId || !stockId) {
                throw new Error("Variant ID or product ID is missing");
            }
            const response = await updateStockVariant(variantId, stockId, values);
            console.log("Variant updated response:", response);

            setVariants((prevVariants) => {
                return prevVariants.map((variant) =>
                    variant.id === variantId ? { ...variant, ...values } : variant
                );
            });

            variantForm.reset();
            setSelectedVariant(null);
        } catch (error) {
            console.error("Error updating variant:", error);
        }
    };

    const confirmDeleteVariant = (variant: StockFormVariant) => {
        toast({
            variant: "destructive",
            title: "Confirm Deletion",
            description: "Are you sure you want to delete this variant?",
            action: (
                <ToastAction
                altText="Delete variant"
                onClick={() => handleDeleteVariant(variant)}>
                Delete
            </ToastAction>
            ),
        });
    };

    const handleDeleteVariant = (variant: StockFormVariant) => {
        const variantId = variant.id;
        const stockId = item?.id;
        if (variantId && stockId) {
            deleteStockVariant(variantId, stockId).then(() => {
                removeVariant(variants.indexOf(variant));
            });
        }
    }

    const removeVariant = (index: number) => {
        const mVariants = [...variants];
        mVariants.splice(index, 1);
        setVariants(_.compact(mVariants));
    }

    const handleEditVariant = (variant: StockFormVariant) => {
        setSelectedVariant(variant);
    }


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
                                <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex">
                                    <h3 className="font-bold flex-1">General Information</h3>
                                    <span className="flex-end"><ChevronDownIcon /></span>
                                </div>

                                <div className="mt-4 flex">
                                    {/* <UploadImageWidget imagePath={'products'} displayStyle={'default'} displayImage={true} setImage={setImageUrl} /> */}
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stock Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter stock name"
                                                            {...field}
                                                            value={field.value}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                

                                <div className="mt-4">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter stock description"
                                                        {...field}
                                                        disabled={isPending}
                                                        className="resize-none bg-gray-50"
                                                        maxLength={200}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-4">
                                   

                                   
                                    {item && (
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            defaultValue={false}
                                            render={({ field }) => (
                                                <FormItem
                                                    className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                    <FormLabel className="flex-1">Stock Status</FormLabel>
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
                                    )}

                                </div>

                                <div
                                    className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex mt-4">
                                    <h3 className="font-bold flex-1">Stock Variants</h3>
                                    <span className="flex-end"><ChevronDownIcon /></span>
                                </div>

                                {variants.length > 0 ?
                                    <div className="border-t-1 border-t-gray-100 p-5">
                                        <h3 className="font-bold pb-2">Variants</h3>
                                        <div className="border-emerald-500 border-0 rounded-md pt-2 pb-2 pl-0 pr-0">
                                            {variants.map((variant: StockFormVariant, index) => {
                                                return <div
                                                    className="flex border-1 border-emerald-200 mt-0 items-center pt-0 pb-0 pl-0 mb-1"
                                                    key={index}
                                                    onClick={() => handleEditVariant(variant)}  
                                                >
                                                    <p className="flex items-center text-gray-500 self-start pl-4 pr-4 font-bold text-xs border-r-1 border-r-emerald-200 h-14 mr-4">
                                                        <span>{index + 1}</span></p>
                                                    <div className="flex-1 pt-1 pb-1">
                                                        <p className="text-md font-medium">{variant.name}</p>
                                                        <p className="text-xs font-medium">VALUE: {variant.startingValue} |
                                                            QUANTITY: {variant.startingQuantity} | ALERT LEVEL: {variant.alertLevel} </p>
                                                    </div>
                                                    {item ? ( 
                                                        <p
                                                            onClick={(e) => {
                                                                e.stopPropagation(); 
                                                                confirmDeleteVariant(variant); 
                                                            }}
                                                            className="flex items-center text-red-700 self-end pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer"
                                                        >
                                                            <span>Delete</span> 
                                                        </p>
                                                    ) : (
                                                        <p
                                                            onClick={() => removeVariant(index)}
                                                            className="flex items-center text-red-700 self-end pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer"
                                                        >
                                                            <span>Remove</span>
                                                        </p>
                                                    )}
                                                </div>
                                            })}
                                        </div>
                                    </div> : <><p className="pt-3 pb-5 text-sm">No variants added</p>
                                        {variants.length === 0 &&
                                            <p className="text-danger-500 text-sm">Add at least one variant then
                                                click save</p>}
                                    </>
                                }


                            </div>

                            <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
                                <CancelButton />
                                <Separator orientation="vertical" />
                                <SubmitButton
                                    isPending={isPending || variants.length === 0}
                                    label={item ? "Update stock" : "Add stock"}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="w-1/3">
                    <Form {...variantForm}>
                        <form
                            onSubmit={variantForm.handleSubmit(saveVariantItem, onInvalid)}
                            className={`gap-1`}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add Stock variants</CardTitle>
                                    <CardDescription>{item ? "Edit variants" : "Add variants"}</CardDescription>
                                   
                                </CardHeader>

                                <CardContent>
                                    <FormError message={error} />
                                    <FormSuccess message={success} />

                                    <div className="mt-4 flex">
                                        <UploadImageWidget imagePath={'products'} displayStyle={'default'} displayImage={true} setImage={setVariantImageUrl} />

                                        <div className="flex-1">
                                            <FormField
                                                control={variantForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Variant Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Variant name ex: Small"
                                                                {...field}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <FormField
                                        control={variantForm.control}
                                        name="startingQuantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Starting Quantity</FormLabel>
                                                <FormControl>
                                                    
                                                <NumericFormat
                                                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                value={field.value}
                                                                disabled={isPending}
                                                                placeholder="0.00"
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
                                        control={variantForm.control}
                                        name="startingValue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Starting Value (Amount)</FormLabel>
                                                <FormControl>
                                                    
                                                <NumericFormat
                                                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                value={field.value}
                                                                disabled={isPending}
                                                                placeholder="0.00"
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
                                        control={variantForm.control}
                                        name="alertLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alert Level</FormLabel>
                                                <FormControl>
                                                <FormControl>
                                                    
                                                <NumericFormat
                                                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2"
                                                                value={field.value}
                                                                disabled={isPending}
                                                                placeholder="0.00"
                                                                thousandSeparator={true}
                                                                allowNegative={false}
                                                                onValueChange={(values) => {
                                                                    const rawValue = Number(values.value.replace(/,/g, ""));
                                                                    field.onChange(rawValue);
                                                                }}
                                                            />
                                               </FormControl>
                                                </FormControl>
                                                <FormDescription>
                                                    Quantity below this level will trigger an alert
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                        
                                </CardContent>

                                <div className="flex ml-6 mb-6">

                                    <SubmitButton
                                        isPending={isPending}
                                        label={selectedVariant ? 'Update Variant' : 'Save Variant'}
                                        onClick={
                                            item
                                                ? (selectedVariant
                                                    ? variantForm.handleSubmit(handleUpdateVariant, onInvalid)
                                                    : variantForm.handleSubmit(handleSaveVariant, onInvalid))
                                                : variantForm.handleSubmit(saveVariantItem, onInvalid)
                                        }
                                    />
                                </div>
                            </Card>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default StockForm;
