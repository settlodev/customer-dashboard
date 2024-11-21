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
import { Product } from "@/types/product/type";
import { ProductSchema } from "@/types/product/schema";
import { createProduct, updateProduct } from "@/lib/actions/product-actions";
import { FormVariantItem } from "@/types/variant/type";
import _ from "lodash";
import { createCategory, fetchAllCategories } from "@/lib/actions/category-actions";
import { Category } from "@/types/category/type";
import { Department } from "@/types/department/type";
import { createDepartment, fectchAllDepartments } from "@/lib/actions/department-actions";
import ProductCategorySelector from "@/components/widgets/product-category-selector";
import ProductDepartmentSelector from "@/components/widgets/product-department-selector";
import ProductBrandSelector from "@/components/widgets/product-brand-selector";
import { VariantSchema } from "@/types/variant/schema";
import { Brand } from "@/types/brand/type";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ProductTaxSelector from "@/components/widgets/product-tax-selector";
import { taxClasses } from "@/types/constants";
import { fectchAllBrands } from "@/lib/actions/brand-actions";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import { createVariant, deleteVariant, updateVariant } from "@/lib/actions/variant-actions";
import { ToastAction } from "../ui/toast";
import { CategorySchema } from "@/types/category/schema";
import { Button } from "@/components/ui/button";
import { DepartmentSchema } from "@/types/department/schema";
import { fetchUnits } from "@/lib/actions/unit-actions";
import { Units } from "@/types/unit/type";
import { Stock } from "@/types/stock/type";
import { fetchStock } from "@/lib/actions/stock-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { NumericFormat } from 'react-number-format';

function ProductForm({ item }: { item: Product | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [error] = useState<string | undefined>("");
    const [success,] = useState<string | undefined>("");

    const [variants, setVariants] = useState<FormVariantItem[]>([]);
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [units, setUnits] = useState<Units[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<Units[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [variantImageUrl, setVariantImageUrl] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [categoryImageUrl, setCategoryImageUrl] = useState<string>('');
    const [departmentImageUrl, setDepartmentImageUrl] = useState<string>('');
    const [selectedVariant, setSelectedVariant] = useState<FormVariantItem | null>(null);
    const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
    const [departmentModalVisible, setDepartmentModalVisible] = useState<boolean>(false);
    const [inventoryTracking, setInventoryTracking] = useState<boolean>(false);
    const [, setStocks] = useState<Stock[]>([]);
    const [combinedStockOptions, setCombinedStockOptions] = useState<{ id: string; displayName: string }[]>([]);
    // const [, setRawPrice] = useState('');

    const { toast } = useToast();

    useEffect(() => {
        const getData = async () => {
            try {
                const [categoryResponse, departmentResponse, brandResponse, unitResponse, stockResponse] = await Promise.all([
                    fetchAllCategories(),
                    fectchAllDepartments(),
                    fectchAllBrands(),
                    fetchUnits(),
                    fetchStock()
                ])
                setCategories(categoryResponse);
                setDepartments(departmentResponse);
                setBrands(brandResponse);
                setUnits(unitResponse);
                setFilteredUnits(unitResponse);
                setStocks(stockResponse);

                const combinedOptions = stockResponse.flatMap(stock => stock.stockVariants.map(variant => ({ id: variant.id, displayName: `${stock.name} - ${variant.name}` })));
                setCombinedStockOptions(combinedOptions);

                if (item) {
                    setInventoryTracking(item.trackInventory);



                    // const selectedOption = combinedOptions.find(
                    //     (opt) => opt.id === item.variants[0]?.stockVariant
                    // );
                    form.reset({
                        ...item,
                        // trackInventory: item.trackInventory,
                        // stock: selectedOption?.id
                    });
                }

            } catch (error) {

                throw error;
            }
        };
        getData();
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredUnits([]);
        } else {
            setFilteredUnits(
                units.filter(unit => unit.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
    }, [searchTerm, units]);

    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: item ? item : { status: true },
    });

    const categoryForm = useForm<z.infer<typeof CategorySchema>>({
        resolver: zodResolver(CategorySchema)
    });

    const departmentForm = useForm<z.infer<typeof DepartmentSchema>>({
        resolver: zodResolver(DepartmentSchema)
    });

    const variantForm = useForm<z.infer<typeof VariantSchema>>({
        resolver: zodResolver(VariantSchema),
        defaultValues: {
            name: '',
            price: 0,
            sku: '',
            quantity: 0,
            description: '',
            image: '',
            unit: '',
            stockVariant: '',
        },
    });

    useEffect(() => {
        if (item && item.variants) {
            setVariants(item.variants.map(variant => ({
                ...variant,
                id: variant.id,
                name: variant.name,
                price: variant.price,

                sku: variant.sku ? variant.sku : '',
                quantity: variant.quantity,
                description: variant.description,
                image: variant.image ? variant.image : '',
                color: variant.color ? variant.color : '',
                product: variant.product ? variant.product : null,
                stockVariant: variant.stockVariant ? variant.stockVariant : '',
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

    const submitData = (values: z.infer<typeof ProductSchema>) => {
        values.variants = variants;
        if (imageUrl) {
            values.image = imageUrl;
        }

        startTransition(() => {
            if (item) {
                updateProduct(item.id, values).then((data) => {
                    //if (data) setResponse(data);
                    console.log(" Update product data:", data)
                });
            } else {
                createProduct(values)
                    .then((data) => {
                        console.log("Create product data: ", data);
                        //if (data) setResponse(data);
                    })
                    .catch((err) => {
                        console.log("Error while creating product: ", err);
                    });
            }
        });
    };

    const submitCategoryData = (values: z.infer<typeof CategorySchema>) => {

        if (categoryImageUrl) {
            values.image = categoryImageUrl;
        }

        startTransition(() => {
            createCategory(values)
                .then(async () => {
                    const categories = await fetchAllCategories();
                    setCategories(categories);
                    setCategoryModalVisible(false);
                })
                .catch((err) => {
                    console.log("Error while creating product: ", err);
                });
        });
    };

    const submitDepartmentData = (values: z.infer<typeof DepartmentSchema>) => {

        if (categoryImageUrl) {
            values.image = departmentImageUrl;
        }

        startTransition(() => {
            createDepartment(values)
                .then(async () => {
                    const departments = await fectchAllDepartments();
                    setDepartments(departments);
                    setDepartmentModalVisible(false);
                })
                .catch((err) => {
                    console.log("Error while creating product: ", err);
                });
        });
    };

    const saveVariantItem = (values: z.infer<typeof VariantSchema>) => {
        if (variantImageUrl) {
            values.image = variantImageUrl ? variantImageUrl : '';
        }
        setVariants([values, ...variants]);
        variantForm.reset();
        setSelectedVariant(null);

        console.log("The details of the variant:", values);
    }

    const handleSaveVariant = (values: z.infer<typeof VariantSchema>) => {
        if (variantImageUrl) {
            values.image = variantImageUrl;
        }

        const productId = item?.id;
        console.log("Selected product ID:", productId);

        try {
            if (!productId) {
                console.error("Product ID is missing");
                return;
            }
            const response = createVariant(productId, values);
            console.log("Variant created response:", response);

            saveVariantItem(values);
            variantForm.reset();
            setSelectedVariant(null);

        } catch (error) {
            console.error("Error creating variant:", error);
        }
    }

    const handleUpdateVariant = async (values: z.infer<typeof VariantSchema>) => {

        if (variantImageUrl) {
            values.image = variantImageUrl;
        }

        const variantId = selectedVariant?.id;
        const productId = item?.id;
        console.log("Selected variant ID:", variantId);

        try {
            if (!variantId || !productId) {
                throw new Error("Variant ID or product ID is missing");
            }
            const response = await updateVariant(variantId, productId, values);
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

    const confirmDeleteVariant = (variant: FormVariantItem) => {
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

    const handleDeleteVariant = (variant: FormVariantItem) => {
        const variantId = variant.id;
        const productId = item?.id;
        if (variantId && productId) {
            deleteVariant(variantId, productId).then(() => {
                removeVariant(variants.indexOf(variant));
            });
        }
    }

    const removeVariant = (index: number) => {
        const mVariants = [...variants];
        mVariants.splice(index, 1);
        setVariants(_.compact(mVariants));
    }

    const handleEditVariant = (variant: FormVariantItem) => {
        setSelectedVariant(variant);
    }
    const openCategoryModal = () => {
        setCategoryModalVisible(true)
    }
    const openDepartmentModal = () => {
        setDepartmentModalVisible(true)
    }
    const handleInventoryTrackingChange = (value: boolean) => {
        setInventoryTracking(value);
        console.log("Addon tracking enabled:", value);
        toast({
            title: "Inventory Tracking",
            description: value
                ? "You will need to select stock and stock variant(s) to track this product."
                : "You won't be able to track the stock and stock variant for this product.",
            variant: value ? "default" : "destructive",
            duration: 3000,
        })
    };

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value;
    //     // Update raw price state
    //     setRawPrice(value);
    // };
    

    return (<>
        {categoryModalVisible ?
            <>
                <div className="fixed w-[100%] h-[100%] bg-black z-999 left-0 top-0 opacity-20"></div>
                <div className="fixed w-[100%] h-[100%] z-999 left-0 top-0 flex items-center justify-center">
                    <div className="w-[500px] p-5 bg-white rounded-md">
                        <CardTitle className="border-b-1 border-b-gray-200 pb-4 mb-4">
                            Create category
                        </CardTitle>

                        <Form {...categoryForm}>
                            <form
                                onSubmit={categoryForm.handleSubmit(submitCategoryData, onInvalid)}
                                className={`gap-1`}>
                                <div>
                                    <FormError message={error} />
                                    <FormSuccess message={success} />
                                    <div className="mt-4 flex">
                                        <UploadImageWidget imagePath={'categories'} displayStyle={'default'}
                                            displayImage={true} setImage={setCategoryImageUrl} />
                                        <div className="flex-1">
                                            <FormField
                                                control={categoryForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter category name"
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

                                    <div className="flex mt-6 pt-4 border-t-1 border-t-gray-200 gap-10">
                                        <Button type="submit" disabled={isPending} className="bg-emerald-500 flex-1">Save </Button>
                                        <div onClick={() => setCategoryModalVisible(false)} className="cursor-pointer text-emerald-500 font-medium flex flex-1 gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md"><span>Cancel</span></div>
                                    </div>
                                </div>

                            </form>
                        </Form>

                    </div>
                </div>
            </>
            : <></>
        }

        {departmentModalVisible ?
            <>
                <div className="fixed w-[100%] h-[100%] bg-black z-999 left-0 top-0 opacity-20"></div>
                <div className="fixed w-[100%] h-[100%] z-999 left-0 top-0 flex items-center justify-center">
                    <div className="w-[500px] p-5 bg-white rounded-md">
                        <CardTitle className="border-b-1 border-b-gray-200 pb-4 mb-4">
                            Create department
                        </CardTitle>

                        <Form {...departmentForm}>
                            <form
                                onSubmit={departmentForm.handleSubmit(submitDepartmentData, onInvalid)}
                                className={`gap-1`}>
                                <div>
                                    <FormError message={error} />
                                    <FormSuccess message={success} />
                                    <div className="mt-4 flex">
                                        <UploadImageWidget imagePath={'categories'} displayStyle={'default'} displayImage={true} setImage={setDepartmentImageUrl} />
                                        <div className="flex-1">
                                            <FormField
                                                control={departmentForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Department Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter department name"
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

                                    <div className="flex mt-6 pt-4 border-t-1 border-t-gray-200 gap-10">
                                        <Button type="submit" disabled={isPending} className="bg-emerald-500 flex-1">Save</Button>
                                        <div onClick={() => setDepartmentModalVisible(false)} className="cursor-pointer text-emerald-500 font-medium flex flex-1 gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md"><span>Cancel</span></div>
                                    </div>
                                </div>

                            </form>
                        </Form>

                    </div>
                </div>
            </>
            : <></>
        }

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
                                    <UploadImageWidget imagePath={'products'} displayStyle={'default'}
                                        displayImage={true} setImage={setImageUrl} />
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter product name"
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

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-2">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="w-full">
                                                    <div className="flex items-center">
                                                        <div className="flex-1">Category</div>
                                                        <div className="flex mt-2 items-center self-end">
                                                            <div onClick={() => openCategoryModal()}
                                                                className="cursor-pointer text-emerald-500 font-medium flex gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md">
                                                                <span>Create</span> <PlusIcon size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormLabel>
                                                {categories && categories.length > 0 ?
                                                    <FormControl>
                                                        <ProductCategorySelector
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            onBlur={field.onBlur}
                                                            isRequired
                                                            isDisabled={isPending}
                                                            label="Category"
                                                            placeholder="Select category"
                                                            categories={categories}
                                                        />
                                                    </FormControl> :
                                                    <><p className="border-1 text-sm border-gray-100 rounded-md p-2 text-red-500">You dont have any category</p></>
                                                }
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="department"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    <div className="flex items-center">
                                                        <div className="flex-1">Department</div>
                                                        <div className="flex mt-2 items-center self-end">
                                                            <div onClick={() => openDepartmentModal()}
                                                                className="cursor-pointer text-emerald-500 font-medium flex gap-1 items-center justify-center border-1 border-emerald-500 p-1 rounded-md">
                                                                <span>Create</span> <PlusIcon size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormLabel>
                                                <FormControl>
                                                    {departments && departments.length > 0 ?
                                                        <ProductDepartmentSelector
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            onBlur={field.onBlur}
                                                            isRequired
                                                            isDisabled={isPending}
                                                            label="Department"
                                                            placeholder="Select department"
                                                            departments={departments}
                                                        /> : <>
                                                            <p className="border-1 text-sm border-gray-100 rounded-md p-2 text-red-500">You dont have any department</p>
                                                        </>
                                                    }
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Brand</FormLabel>
                                                <FormControl>
                                                    <ProductBrandSelector
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Brand"
                                                        placeholder="Select brand"
                                                        brands={brands}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-4">
                                <FormField
                                        control={form.control}
                                        name="trackInventory"
                                        render={({ field }) => (
                                            <FormItem
                                                className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                <FormLabel className="flex-1">Track Inventory</FormLabel>
                                                <FormControl className="self-end">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={(value) => {
                                                            field.onChange(value);
                                                            handleInventoryTrackingChange(value);
                                                        }}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="sellOnline"
                                        defaultValue={false}
                                        render={({ field }) => (
                                            <FormItem
                                                className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                <FormLabel className="flex-1">Sell Online</FormLabel>
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
                                    <FormField
                                        control={form.control}
                                        name="taxIncluded"
                                        defaultValue={false}
                                        render={({ field }) => (
                                            <FormItem
                                                className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                <FormLabel className="flex-1">Tax Included</FormLabel>
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



                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="taxClass"
                                        defaultValue={taxClasses[0].name}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Class</FormLabel>
                                                <FormControl>
                                                    <ProductTaxSelector
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Tax Class"
                                                        placeholder="Select tax class"
                                                        data={taxClasses}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter SKU"
                                                        {...field}
                                                        disabled={isPending}
                                                        value={field.value || ''}
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
                                            defaultValue={false}
                                            render={({ field }) => (
                                                <FormItem
                                                    className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                    <FormLabel className="flex-1">Product Status</FormLabel>
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
                                <div className="mt-4">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter product description"
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

                                <div
                                    className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex mt-4">
                                    <h3 className="font-bold flex-1">Product Variants</h3>
                                    <span className="flex-end"><ChevronDownIcon /></span>
                                </div>

                                {variants.length > 0 ?
                                    <div className="border-t-1 border-t-gray-100 p-5">
                                        <h3 className="font-bold pb-2">Variants</h3>
                                        <div className="border-emerald-500 border-0 rounded-md pt-2 pb-2 pl-0 pr-0">
                                            {variants.map((variant: FormVariantItem, index) => {
                                                return <div
                                                    className="flex border-1 border-emerald-200 mt-0 items-center pt-0 pb-0 pl-0 mb-1"
                                                    key={index}
                                                    onClick={() => handleEditVariant(variant)}
                                                >
                                                    <p className="flex items-center text-gray-500 self-start pl-4 pr-4 font-bold text-xs border-r-1 border-r-emerald-200 h-14 mr-4">
                                                        <span>{index + 1}</span></p>
                                                    <div className="flex-1 pt-1 pb-1">
                                                        <p className="text-md font-medium">{variant.name}</p>
                                                        <p className="text-xs font-medium">PRICE: {variant.price} | QTY: {variant.quantity}</p>
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
                                    label={item ? "Update product" : "Save Product"}
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
                                    <CardTitle>Add variants</CardTitle>
                                    <CardDescription>{item ? "Edit variants" : "Add variants"}</CardDescription>
                                    {item && (
                                        <span className="text-sm text-white bg-blue-500 p-2 rounded">Please,select the variant you want to edit on product variants</span>
                                    )}
                                </CardHeader>

                                <CardContent>
                                    <FormError message={error} />
                                    <FormSuccess message={success} />

                                    <div className="mt-4 flex">
                                        <UploadImageWidget imagePath={'products'} displayStyle={'default'}
                                            displayImage={true} setImage={setVariantImageUrl} />

                                        <div className="flex-1">
                                            <FormField
                                                control={variantForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Variant Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter variant name ex: Small"
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
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Selling Price</FormLabel>
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
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
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
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter SKU"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="barcode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Barcode</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter Barcode"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit</FormLabel>
                                                <FormControl>
                                                    <div className="relative flex flex-col w-full max-w-sm">

                                                        <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-1.5">
                                                            <SearchIcon className="h-4 w-4 mr-2.5" />
                                                            <Input
                                                                type="search"
                                                                placeholder="Search e.g Kilogram"
                                                                className="w-full border-0"
                                                                value={searchTerm}
                                                                disabled={isPending}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                            />
                                                        </div>

                                                        {searchTerm && filteredUnits.length > 0 && (
                                                            <div className="absolute mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-md z-10">
                                                                {filteredUnits.map((unit) => (
                                                                    <div
                                                                        key={unit.id}
                                                                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            field.onChange(unit.id);
                                                                            setSearchTerm(unit.name);
                                                                            setFilteredUnits([]);
                                                                        }}
                                                                    >
                                                                        {unit.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                   
                                    {inventoryTracking && (
                                        <FormField
                                            control={variantForm.control}
                                            name="stockVariant"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stock Variant</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                            disabled={isPending}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select stock variant" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {combinedStockOptions.map((option) => (
                                                                    <SelectItem key={option.id} value={option.id}>
                                                                        {option.displayName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={variantForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter variant description"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
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


    </>
    )
}

export default ProductForm;
