"use client";

import {Input} from "@/components/ui/input";
import {FieldErrors, useForm} from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import React, {useCallback, useEffect, useState, useTransition} from "react";
import {useToast} from "@/hooks/use-toast";
import {FormResponse} from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import {SubmitButton} from "../widgets/submit-button";
import {Separator} from "@/components/ui/separator";
import {AddonSchema} from "@/types/addon/schema";
import {createAddon, updateAddon} from "@/lib/actions/addon-actions";
import {Addon} from "@/types/addon/type";
import {Switch} from "../ui/switch";
import {NumericFormat} from "react-number-format";
import TrackingOptions from "../widgets/tracker-selector";
import {DollarSign, PlusCircle, Power,ToggleLeft} from "lucide-react";
// import MultipleSelector from "../widgets/multiple-product-selector";
// import { Product } from "@/types/product/type";
// import { fectchAllProducts } from "@/lib/actions/product-actions";


function AddonForm({item}: { item: Addon | null | undefined }) {

console.log("The item is: ", item);
    const [isPending, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();
    const [addonTracking, setAddonTracking] = useState<boolean>(false);
    // const [products, setProducts] = useState<Product[]>([])
    // const [,setLoading] = useState(true);
    
    // useEffect(() => {
    //     const loadProducts = async () => {
    //       setLoading(true);
    //       const fetchedProducts = await fectchAllProducts();
    //       console.log("Fetched products:", fetchedProducts);
    //       setProducts(fetchedProducts);
    //       setLoading(false);
    //     };
    
    //     loadProducts();
    //   }, []);
    const {toast} = useToast();

    const form = useForm<z.infer<typeof AddonSchema>>({
        resolver: zodResolver(AddonSchema),
        defaultValues: {
            ...item,
            stockVariant: item?.stockVariant ? item.stockVariant.id : null,
            recipe: item?.recipe ? item.recipe.id : null,
            status: true
        },
    });

    useEffect(() => {
        if (item && item.isTracked === true && !addonTracking) {
            setAddonTracking(true);
        } else if (item && item.isTracked === false && addonTracking) {
            setAddonTracking(false);
        }
    }, [item, addonTracking]);
    


    const handleAddonTrackingChange = (value: boolean) => {
        setAddonTracking(value);
    };

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("Errors during form submission:", errors);
          toast({
            variant: "destructive",
            title: "Uh oh! something went wrong",
            description:typeof errors.message === 'string' && errors.message
              ? errors.message
              : "There was an issue submitting your form, please try later",
          });
        },
        [toast]
      );
    
      const handleTrackingSelectionChange = (selection: { itemType: string; itemId: string | null }) => {
        const { itemType, itemId } = selection;
    
        console.log("Selected item type:", itemType);
        console.log("Selected item ID:", itemId);
    
        if (itemType && itemId) {
            form.setValue(itemType as keyof z.infer<typeof AddonSchema>, itemId, { shouldValidate: true });
            console.log("Updated form value for", itemType, "to", itemId);
        }
    
        // Log the entire form state to verify values
        console.log("Current form values:", form.getValues());
    };

    const submitData = (values: z.infer<typeof AddonSchema>) => {
        const {stockVariant, recipe} = form.getValues();
        const payload = {
            ...values,
            stockVariant: stockVariant,
            recipe: recipe
        };

        console.log("Submitting data:", payload);

        startTransition(() => {
            if (item) {
                updateAddon(item.id, payload).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "error") {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: data.message
                        });
                    }
                });
            } else {
                createAddon(payload).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "error") {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: data.message
                        });
                    }
                });
            }
        });
    };

   

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-gray-700">
                                        <PlusCircle className="h-4 w-4" />
                                        Addon Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Enter addon title e.g. Cheese"
                                            disabled={isPending}
                                            className="bg-white"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-gray-700">
                                        <DollarSign className="h-4 w-4" />
                                        Addon Price
                                    </FormLabel>
                                    <FormControl>
                                        <NumericFormat
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="isTracked"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                        <div className="space-y-0.5">
                                            <FormLabel className="flex items-center gap-2 text-gray-700">
                                                <ToggleLeft className="h-4 w-4" />
                                                Tracking Options
                                            </FormLabel>
                                            <p className="text-sm text-gray-500">
                                                Enable tracking for this addon
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(value) => {
                                                    field.onChange(value);
                                                    handleAddonTrackingChange(value);
                                                }}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* <FormField
                        control={form.control}
                        name="productIds"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700">
                                <Tags className="h-4 w-4" />
                                Applicable Products
                            </FormLabel>
                            <FormControl>
                            <MultipleSelector
                            defaultOptions={products.map(product => ({ value: product.id, label: product.name }))}
                            placeholder="Select product items..."
                            emptyIndicator={
                            <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                                no results found.
                            </p>
                            }
                            {...field}
                        />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        /> */}

                        {item && (
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="space-y-0.5">
                                                <FormLabel className="flex items-center gap-2 text-gray-700">
                                                    <Power className="h-4 w-4" />
                                                    Addon Status
                                                </FormLabel>
                                                <p className="text-sm text-gray-500">
                                                    Toggle addon availability
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {addonTracking && (
                        <div className="p-4 rounded-lg border border-blue-100">
                            <h3 className="text-sm font-medium">
                                Tracking Options
                            </h3>
                            <TrackingOptions
                                onSelectionChange={handleTrackingSelectionChange}
                                initialItemType={item?.stockVariant ? "stock" : "recipe"}
                                initialItemId={item?.stockVariant ? item?.stockVariant.id : item?.recipe?.id || null}
                            />
                        </div>
                    )}
                </div>

                <div className="flex h-5 items-center space-x-4 mt-10">
                    <CancelButton/>
                    <Separator orientation="vertical"/>
                    <SubmitButton
                        isPending={isPending}
                        label={item ? "Update Addon details" : "Add Addon"}
                    />
                </div>
            </form>
        </Form>
    );
};

export default AddonForm;
