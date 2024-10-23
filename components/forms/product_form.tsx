"use client";

import {
  Card,
  CardContent,
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
import {z} from "zod";
import React, {useCallback, useEffect, useState, useTransition} from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import {Product} from "@/types/product/type";
import {ProductSchema} from "@/types/product/schema";
import {createProduct, updateProduct} from "@/lib/actions/product-actions";
import {FormVariantItem} from "@/types/variant/type";
import _ from "lodash";
import {fetchAllCategories} from "@/lib/actions/category-actions";
import {Category} from "@/types/category/type";
import {Department} from "@/types/department/type";
import {fectchAllDepartments} from "@/lib/actions/department-actions";
import ProductCategorySelector from "@/components/widgets/product-category-selector";
import ProductDepartmentSelector from "@/components/widgets/product-department-selector";
import ProductBrandSelector from "@/components/widgets/product-brand-selector";
import {VariantSchema} from "@/types/variant/schema";
import {Brand} from "@/types/brand/type";
import {ChevronDownIcon, ImageIcon} from "lucide-react";
import {Textarea} from "@/components/ui/textarea";
import {Switch} from "@/components/ui/switch";
import ProductTaxSelector from "@/components/widgets/product-tax-selector";
import {taxClasses} from "@/types/constants";
import {fectchAllBrands} from "@/lib/actions/brand-actions";
import {uploadImage} from "@/lib/utils";

function ProductForm({ item }: { item: Product | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [formResponse, setResponse] = useState<FormResponse | undefined>();
    const [error] = useState<string | undefined>("");
    const [success,] = useState<string | undefined>("");

    console.log("formResponse;", formResponse)

    const [variants, setVariants] = useState<FormVariantItem[]>([]);
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const {toast} = useToast();

    useEffect(() => {
        const getData = async () => {
            const categories = await fetchAllCategories();
            setCategories(categories);

            const departments = await fectchAllDepartments();
            setDepartments(departments);

            const brands = await fectchAllBrands();
            setBrands(brands);
        }
        getData();
    }, []);

    const form = useForm<z.infer<typeof ProductSchema>>({
        resolver: zodResolver(ProductSchema),
        defaultValues: item ? item : {status: true},
    });

    const variantForm = useForm<z.infer<typeof VariantSchema>>({
        resolver: zodResolver(VariantSchema)
    });

    const onInvalid = useCallback(
        (errors: any) => {
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
        values.variants=variants;

        startTransition(() => {
            if (item) {
                updateProduct(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createProduct(values)
                  .then((data) => {
                    console.log("Create Business Response: ", data);
                    if (data) setResponse(data);
                  })
                  .catch((err) => {
                    console.log("Create Business Error: ", err);
                  });
            }
        });
    };

    const saveVariantItem = (values: z.infer<typeof VariantSchema>) => {
        setVariants([values, ...variants]);
    }

    const removeVariant = (index: number) => {
        const mVariants = [...variants];
        mVariants.splice(index, 1);
        setVariants(_.compact(mVariants));
    }

    const uploadMyImage=async(mFile: File)=>{
        setUploading(true);
        setFile(mFile);

        await uploadImage(mFile, function (response) {
            console.log("My response is:", response.data);
            setUploading(true);
        });
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
                                <FormError message={error}/>
                                <FormSuccess message={success}/>
                                <div className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex">
                                    <h3 className="font-bold flex-1">General Information</h3>
                                    <span className="flex-end"><ChevronDownIcon/></span>
                                </div>

                                <input type="hidden" name="image" value="https://www.foodandwine.com/thmb/Wd4lBRZz3X_8qBr69UOu2m7I2iw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/classic-cheese-pizza-FT-RECIPE0422-31a2c938fc2546c9a07b7011658cfd05.jpg" />

                                <div className="mt-4 flex">
                                    <label
                                        className="cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col">
                                        <span><ImageIcon/></span>
                                        <span className="text-xs font-bold">Image</span>

                                        <input
                                            className="hidden"
                                            type="file"
                                            name="file"
                                            onChange={(e) => {
                                                const files = e.target.files
                                                if (files) {
                                                    uploadMyImage(files[0])
                                                }
                                            }}
                                            accept="image/png, image/jpeg, image/jpg"
                                        />

                                    </label>
                                    <div className="flex-1">
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
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-2">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
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
                                                </FormControl>
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
                                                <FormControl>
                                                    <ProductDepartmentSelector
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        isRequired
                                                        isDisabled={isPending}
                                                        label="Department"
                                                        placeholder="Select department"
                                                        departments={departments}
                                                    />
                                                </FormControl>
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
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="trackInventory"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex lg:mt-4 items-center gap-2 border-1 pt-1 pb-2 pl-3 pr-3 rounded-md">
                                                <FormLabel className="flex-1">Track Inventory</FormLabel>
                                                <FormControl className="self-end">
                                                    <Switch
                                                        checked={field.value !== undefined ? field.value : true}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sellOnline"
                                        defaultValue={false}
                                        render={({field}) => (
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
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxIncluded"
                                        defaultValue={false}
                                        render={({field}) => (
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
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="mt-4">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({field}) => (
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
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="taxClass"
                                        defaultValue={taxClasses[0].name}
                                        render={({field}) => (
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
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter SKU"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    {/*<FormField
                                        control={form.control}
                                        name="color"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Tag Color</FormLabel>
                                                <FormControl>
                                                    <Checkbox
                                                        defaultValue={'black'}
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />*/}

                                </div>

                                <div
                                    className="bg-gray-200 pl-3 pr-3 pt-2 pb-2 border-0 border-emerald-100- flex mt-4">
                                    <h3 className="font-bold flex-1">Product Variants</h3>
                                    <span className="flex-end"><ChevronDownIcon/></span>
                                </div>

                                {variants.length > 0 ?
                                    <div className="border-t-1 border-t-gray-100 p-5">
                                        <h3 className="font-bold pb-2">Variants</h3>
                                        <div className="border-emerald-500 border-0 rounded-md pt-2 pb-2 pl-0 pr-0">
                                            {variants.map((variant: FormVariantItem, index) => {
                                                return <div
                                                    className="flex border-1 border-emerald-200 mt-0 items-center pt-0 pb-0 pl-0 mb-1"
                                                    key={index}>
                                                    <p onClick={() => removeVariant(index)}
                                                       className="flex items-center text-gray-500 self-start pl-4 pr-4 font-bold text-xs border-r-1 border-r-emerald-200 h-14 mr-4">
                                                        <span>{index + 1}</span></p>
                                                    <div className="flex-1 pt-1 pb-1">
                                                        <p className="text-md font-medium">{variant.name}</p>
                                                        <p className="text-xs font-medium">PRICE: {variant.price} |
                                                            COST: {variant.price} | QTY: {variant.quantity}</p>
                                                    </div>
                                                    <p onClick={() => removeVariant(index)}
                                                       className="flex items-center text-red-700 self-end pl-4 pr-4 font-bold bg-emerald-50 text-xs border-l-1 border-l-emerald-200 h-14 cursor-pointer">
                                                        <span>Remove</span></p>
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
                                <CancelButton/>
                                <Separator orientation="vertical"/>
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
                                </CardHeader>

                                <CardContent>
                                    <FormError message={error}/>
                                    <FormSuccess message={success}/>

                                    <FormField
                                        control={variantForm.control}
                                        name="name"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Variant Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter variant name ex: Small"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="price"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Price</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0.00"
                                                        {...field}
                                                        disabled={isPending}
                                                        type={'number'}
                                                        step={0.1}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="cost"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Cost</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0.00"
                                                        {...field}
                                                        disabled={isPending}
                                                        type={'number'} step={0.1}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="quantity"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0.00"
                                                        {...field}
                                                        disabled={isPending}
                                                        type={'number'}
                                                        step={0.1}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="sku"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter SKU"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={variantForm.control}
                                        name="description"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter variant description"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>

                                <div className="flex ml-6 mb-6">
                                    {/*<div className="rounded-xl bg-emerald-400 px-4 pt-2 pb-2 text-white font-bold"
                                             onClick={() => saveVariantItem()}>
                                            Add variant
                                        </div>*/}

                                    <SubmitButton
                                        isPending={isPending}
                                        label={'Save Variant'}
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

export default ProductForm;
