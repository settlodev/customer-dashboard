"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";
import {Trash2, Plus, ListPlus, Settings, Building2, Info} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { createProduct, updateProduct } from "@/lib/actions/product-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {Product} from "@/types/product/type";
import { FormResponse } from "@/types/types";
import { ProductSchema } from "@/types/product/schema";
import BrandSelector from "@/components/widgets/brand-selector";
import DepartmentSelector from "@/components/widgets/department-selector";
import CategorySelector from "../widgets/category-selector";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import RecipeSelector from "@/components/widgets/recipe-selector";
import UnitSelector from "@/components/widgets/unit-selector";
import TaxClassSelector from "@/components/widgets/tax-class-selector";

type ProductFormProps = {
    item: Product | null | undefined;
};

export default function ProductForm({ item }: ProductFormProps) {
    console.log("ProductForm item:", item);
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [imageUrl, setImageUrl] = useState(item?.image || '');
    const { toast } = useToast();

    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            name: item?.name,
            description: item?.description || "",
            category: item?.category,
            department: item?.department || null,
            brand: item?.brand || "",
            sku: item?.sku,
            sellOnline: item?.sellOnline || false,
            taxIncluded: item?.taxIncluded || false,
            taxClass: item?.taxClass || "1",
            status: item?.status ?? true,
            image: item?.image || "",
            trackInventory: item?.trackInventory || false,
            trackingType: item?.variants?.[0]?.trackingType || null,
            variants: item?.variants.map(variant => ({
                ...variant,
                trackingType: variant.trackingType || null,
                trackItem: variant.trackItem || null,
                unit: variant.unit || null,
            })) || [{}]
        },
    });


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants"
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("errors", errors);
            toast({
                variant: "destructive",
                title: "Form validation failed",
                description: "Please check your inputs and try again."
            });
        },
        [toast]
    );

    const handleTrackingTypeSelect = (type: string) => {
        // Update product level tracking
        form.setValue('trackInventory', true);
        form.setValue('trackingType', type);

        // Update all variants' tracking settings
        fields.forEach((_, index) => {
            form.setValue(`variants.${index}.trackInventory`, true);
            form.setValue(`variants.${index}.trackingType`, type);
            form.setValue(`variants.${index}.trackItem`, null); // Reset trackItem when changing type
        });

    };

    const handleTrackingDisable = () => {
        // Disable tracking at product level
        form.setValue('trackInventory', false);
        form.setValue('trackingType', null);

        // Disable tracking for all variants
        fields.forEach((_, index) => {
            form.setValue(`variants.${index}.trackInventory`, false);
            form.setValue(`variants.${index}.trackingType`, null);
            form.setValue(`variants.${index}.trackItem`, null);
        });

        // setShowTrackingModal(false);

    };

    const handleAppendVariant = () => {
        const currentTrackInventory = form.getValues('trackInventory');
        const currentTrackingType = form.getValues('trackingType');

        append({
            name: "",
            price: 0,
            sku: "",
            barcode: "",
            description: "",
            unit: null,
            image: "",
            trackInventory: currentTrackInventory || false,
            trackingType: currentTrackingType || null,
            trackItem: null,
        });
    };


    const submitData = (values: z.infer<typeof ProductSchema>) => {
        setResponse(undefined);
        const productData = {
            ...values,
            image: imageUrl
        };

        startTransition(() => {
            if (item) {
                updateProduct(item.id, productData)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data?.responseType === "success") {
                            toast({
                                title: "Success",
                                description: "Product updated successfully"
                            });
                        }
                    });
            } else {
                createProduct(productData)
                    .then((data) => {
                        if (data) setResponse(data);
                        if (data?.responseType === "success") {
                            toast({
                                title: "Success",
                                description: "Product created successfully"
                            });
                        }
                    });
            }
        });
    };

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Top Section - Basic Info and Settings */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <Card className="lg:col-span-2">
                        <CardContent className="pt-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5"/>
                                Basic Information
                            </h2>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <div className="flex flex-col items-center mb-6">
                                        <UploadImageWidget
                                            imagePath="products"
                                            displayStyle="default"
                                            displayImage={true}
                                            showLabel={true}
                                            label="Upload product image"
                                            setImage={setImageUrl}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Product Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter product name"
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
                                        name="description"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        placeholder="Enter product description"
                                                        disabled={isPending}
                                                        className="resize-none h-32"
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="my-6"/>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Building2 className="w-4 h-4"/>
                                    Classification
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <CategorySelector
                                                    {...field}
                                                    placeholder="Select category"
                                                />
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="department"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Department</FormLabel>
                                                <DepartmentSelector
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="brand"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Brand</FormLabel>
                                                <BrandSelector
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column - Settings */}
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5"/>
                                Settings
                            </h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="trackInventory"
                                    render={({field}) => (
                                        <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <FormLabel>Track Inventory</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    Enable inventory tracking
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setShowTrackingModal(true);
                                                        } else {
                                                            handleTrackingDisable();
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sellOnline"
                                    render={({field}) => (
                                        <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <FormLabel>Sell Online</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    Make available in online store
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxClass"
                                    render={({field}) => (
                                        <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <FormLabel>Tax class</FormLabel>
                                            </div>
                                            <FormControl>
                                                <TaxClassSelector
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={field.onChange}
                                                    placeholder="Select tax class"
                                                    isRequired
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxIncluded"
                                    render={({field}) => (
                                        <FormItem className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="space-y-0.5">
                                                <FormLabel>Tax Included</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    Include tax in price
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section - Variants */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ListPlus className="w-5 h-5" />
                                    Product Variants
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Add at least one variant for this product
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAppendVariant}
                                disabled={isPending}
                            >
                                <Plus className="w-4 h-4 mr-2"/>
                                Add Variant
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="border-dashed">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium">Variant {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1 || isPending}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2"/>
                                                Delete
                                            </Button>
                                        </div>

                                        <div className="grid md:grid-cols-4 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.name`}
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
                                                name={`variants.${index}.price`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Price</FormLabel>
                                                        <FormControl>
                                                            <NumericFormat
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                value={field.value}
                                                                onValueChange={(values) => {
                                                                    field.onChange(Number(values.value));
                                                                }}
                                                                thousandSeparator={true}
                                                                placeholder="Enter price"
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.sku`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>SKU</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter SKU"
                                                                disabled={isPending}
                                                                value={field.value ?? ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.unit`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Unit</FormLabel>
                                                        <FormControl>
                                                            <UnitSelector
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                placeholder="Select unit"
                                                                isDisabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Conditional fields based on tracking type */}
                                            {form.watch('trackingType') === 'STOCK' && (
                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.trackItem`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Stock Item</FormLabel>
                                                        <FormControl>
                                                            <StockVariantSelector
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                isDisabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {form.watch('trackingType') === 'RECIPE' && (
                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.trackItem`}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Recipe</FormLabel>
                                                        <FormControl>
                                                            <RecipeSelector
                                                                {...field}
                                                                value={field.value ?? ""}
                                                                placeholder="Select recipe"
                                                                isDisabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                    <CancelButton/>
                    <Separator orientation="vertical" className="h-4"/>
                    <SubmitButton
                        isPending={isPending}
                        label={item ? "Update product" : "Create product"}
                    />
                </div>
        </form>

        {/* Tracking Modal */}
        <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Tracking Type</DialogTitle>
                    <DialogDescription>
                        Choose how you want to track this item in inventory
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {handleTrackingTypeSelect('RECIPE'); setShowTrackingModal(false)}}
                    >
                        Track as Recipe
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {handleTrackingTypeSelect('STOCK'); setShowTrackingModal(false)}}
                    >
                        Track as Stock Item
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </Form>
    );
}
