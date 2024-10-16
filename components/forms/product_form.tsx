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
import {z} from "zod";
import React, {useCallback, useEffect, useState, useTransition} from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import {Product, ProductBrand} from "@/types/product/type";
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
import {register} from "@/lib/actions/auth-actions";

function ProductForm({ item }: { item: Product | null | undefined }) {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");

    const [variants, setVariants] = useState<FormVariantItem[]>([]);
    const [variantName, setName] = useState<string>('');
    const [variantPrice, setPrice] = useState<number>(0);
    const [variantCost, setCost] = useState<number>(0);
    const [variantQty, setQty] = useState<number>(0);
    const [variantSku, setSku] = useState<string>("");
    const [variantImage, setImage] = useState<string>("");
    const [variantColor, setColor] = useState<string>("#000000");
    const [variantDesc, setDesc] = useState<string>("");
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [brands, setBrands] = useState<ProductBrand[]>([]);

    const {toast} = useToast();

    useEffect(() => {
        const getData = async () => {
            const categories = await fetchAllCategories();
            setCategories(categories);

            const departments = await fectchAllDepartments();
            setDepartments(departments);
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
        startTransition(() => {
            if (item) {
                updateProduct(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createProduct(values)
                  .then((data) => {
                    console.log(data);
                    if (data) setResponse(data);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
            }
        });
    };

    const saveVariantItem = (values: z.infer<typeof VariantSchema>) => {
        startTransition(() => {
            /*const variantItem = {
                name: variantName,
                price: variantPrice,
                cost: variantCost,
                quantity: variantQty,
                sku: variantSku,
                description: variantDesc,
                image: variantImage,
                color: variantColor
            }*/

            const mVariants = [values, ...variants];
            setVariants(mVariants);
        });

        console.log("values: ", values);
        return false;
    }

    const removeVariant = (index: number) => {
        const mVariants = [...variants];
        mVariants[index] = null;
        setVariants(_.compact(mVariants));
    }
    return (

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <div className="flex gap-10">
                <div className="flex-1">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(submitData, onInvalid)}
                            className={`gap-1`}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Details</CardTitle>
                                    <CardDescription>
                                        Enter the details of the product
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormError message={error}/>
                                    <FormSuccess message={success}/>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
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
                                            name="slug"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Product Slug</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter product slug"
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
                                                        <Input
                                                            placeholder="Enter product description"
                                                            {...field}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
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
                                                    <FormLabel>Department</FormLabel>
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

                                    {variants.length > 0 && variants.map((variant, index) => {
                                        console.log("variants item:", variant);
                                        return <CardContent key={index}>
                                            <FormField
                                                control={form.control}
                                                name={`variants.${index}.name`}
                                                defaultValue={variant.name}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Variant Name</FormLabel>
                                                        <FormControl>
                                                            <Input
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
                                                defaultValue={variant.price}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Price</FormLabel>
                                                        <FormControl>
                                                            <Input
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
                                                name={`variants.${index}.cost`}
                                                defaultValue={variant.cost}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Cost</FormLabel>
                                                        <FormControl>
                                                            <Input
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
                                                name={`variants.${index}.quantity`}
                                                defaultValue={variant.quantity}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Quantity</FormLabel>
                                                        <FormControl>
                                                            <Input
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
                                                name={`variants.${index}.sku`}
                                                defaultValue={variant.sku}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>SKU</FormLabel>
                                                        <FormControl>
                                                            <Input
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
                                                name={`variants.${index}.description`}
                                                defaultValue={variant.description}
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    })}
                                </CardContent>
                            </Card>

                            <div className="flex h-5 items-center space-x-4 mt-4">
                                <CancelButton/>
                                <Separator orientation="vertical"/>
                                <SubmitButton
                                    isPending={isPending || variants.length === 0}
                                    label={item ? "Update product" : "Save Product"}
                                />
                                {variants.length === 0 && <p className="text-danger-500">Enter at least one variant then click</p>}
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
                                    <CardTitle>Product variants</CardTitle>
                                    <CardDescription>
                                        Add variants to your products
                                    </CardDescription>
                                </CardHeader>
                                {variants.length > 0 ?
                                    <div className="ml-5 mr-6">
                                        <h3 className="font-bold pb-2">Variants</h3>
                                        <div className="border-emerald-500 border-1 rounded-md pt-2 pb-2 pl-4 pr-4">
                                            {variants.length > 0 ?
                                                <>
                                                    {variants.map((variant: FormVariantItem, index) => {
                                                        return <div className="flex border-b-1 border-b-emerald-200"
                                                                    key={index}>
                                                            <p className="flex-1 text-sm font-bold">{index + 1}. {variant.name}</p>
                                                            <p onClick={() => removeVariant(index)}
                                                               className="text-white self-end px-3 rounded-xl m-1 border-1 bg-red-600 font-bold">X</p>
                                                        </div>
                                                    })}
                                                </> :
                                                <p>No variants added</p>
                                            }
                                        </div>
                                    </div>
                                : <></>}

                                <CardContent>
                                    <FormError message={error} />
                                    <FormSuccess message={success} />

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
