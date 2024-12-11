"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {useCallback, useEffect, useState, useTransition} from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "../ui/separator";

import {
    Form,
    FormControl,
    FormField,
    FormItem, FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {createCategory, fetchAllCategories, updateCategory} from "@/lib/actions/category-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import {Category} from "@/types/category/type";
import {FormResponse} from "@/types/types";
import {CategorySchema} from "@/types/category/schema";
import {FormError} from "@/components/widgets/form-error";
import {Input} from "@/components/ui/input";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import ProductCategorySelector from "@/components/widgets/product-category-selector";
import ItemStatusSelector from "@/components/widgets/item-status-selector";
import {ItemStatuses} from "@/types/constants";
import {useToast } from "@/hooks/use-toast";

const CategoryForm = ({ item }: { item: Category | null | undefined }) => {
    console.log("The item is",item)

    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [imageUrl, setImageUrl] = useState<string>(item && item.image?item.image: "");
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [status, setStatus] = useState<boolean>(item?item.status: ItemStatuses[0].value);
    const { toast } = useToast();

    useEffect(() => {
        const getData = async () => {
            const categories = await fetchAllCategories();
            setCategories(categories);
        }
        getData();
    }, []);

   
    const form = useForm<z.infer<typeof CategorySchema>>({
        resolver: zodResolver(CategorySchema),
        defaultValues: {
            ...item,
            image: imageUrl ? imageUrl : (item && item.image?item.image: ""),
            parentCategory: item?.parentCategory || "",
            status: item ? !!item.status : false,
        }
    });
    const onInvalid = useCallback(
        (errors: FieldErrors) => {
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

    const submitData = (values: z.infer<typeof CategorySchema>) => {
        setResponse(undefined);

        if(imageUrl) {
            values.image = imageUrl;
        }

        values.status = status;

        startTransition(() => {
            if (item) {
                const updatedValues = {
                    ...values,
                    parentCategory: values.parentCategory || item.parentCategory || "",
                };

                updateCategory(item.id, updatedValues,'category').then((data) => {
                    if (data) setResponse(data);

                    if(data?.responseType === "success") {
                        toast({
                            variant: "default",
                            title: "Category updated successfully",
                            description: "Category has been updated successfully",
                            duration:5000
                        });
                    }
                });
            } else {
                createCategory(values, 'category').then((data) => {
                    if (data) setResponse(data);
                    
                    if(data?.responseType === "success") {
                        toast({
                            variant: "default",
                            title: "Category created successfully",
                            description: "Category has been created successfully",
                            duration:5000
                        });
                    }
                });
            }
        });
    };

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form className="space-y-8]" onSubmit={form.handleSubmit(submitData, onInvalid)}>
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <div className="mt-4 flex">
                            <UploadImageWidget
                                imagePath={'categories'}
                                displayStyle={'default'}
                                displayImage={true}
                                showLabel={false}
                                label="Image"
                                setImage={setImageUrl}
                            />
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Category Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter category name"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="parentCategory"
                                render={({field}) => (

                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <FormControl>
                                            <ProductCategorySelector
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                isRequired
                                                isDisabled={isPending}
                                                label="Category"
                                                placeholder="Select parent category"
                                                categories={categories}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({field}) => (

                                    <FormItem>
                                        <FormLabel>Category Status </FormLabel>
                                        <FormControl>
                                            <ItemStatusSelector
                                                onChange={(newStatus) => {
                                                    const booleanValue = newStatus === "true"; 
                                                    field.onChange(booleanValue); 
                                                    setStatus(booleanValue); 
                                                }}
                                                onBlur={field.onBlur}
                                                isRequired
                                                isDisabled={isPending}
                                                label="Status"
                                                value={String(status)}
                                                placeholder="Select Status"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />
                        </div>

                        <div className="flex h-5 items-center space-x-4">
                            <CancelButton/>
                            <Separator orientation="vertical"/>
                            <SubmitButton
                                isPending={isPending}
                                label={item ? "Update " : "Create"}
                            />
                        </div>
                    </div>
                    </div>
            </form>
        </Form>
);
};

export default CategoryForm;
