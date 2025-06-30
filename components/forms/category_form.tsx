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
import {Tag} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import { useRouter } from "next/navigation";

const CategoryForm = ({ item }: { item: Category | null | undefined }) => {

    const [isPending, startTransition] = useTransition();
    const [,setResponse] = useState<FormResponse | undefined>();
    const [imageUrl, setImageUrl] = useState<string>(item && item.image?item.image: "");
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [error,] = useState<string | undefined>("");

    const [status, setStatus] = useState<boolean>(item?item.status: ItemStatuses[0].value);
    const { toast } = useToast();
    const router = useRouter();

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
            status: item ? item.status : false,
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

        if(imageUrl) values.image = imageUrl;

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
                        router.push("/categories");
                    }
                });
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitData, onInvalid)}>
                <FormError message={error} />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Category Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-6 items-start">
                            <div className="space-y-4">
                                <FormLabel className="block mb-2">Category Image</FormLabel>
                                <div className="bg-gray-50 rounded-lg p-4 content-center">
                                    <UploadImageWidget
                                        imagePath={'categories'}
                                        displayStyle={'default'}
                                        displayImage={true}
                                        showLabel={false}
                                        label="Image"
                                        setImage={setImageUrl}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                    <Input
                                                        className="pl-10"
                                                        placeholder="Enter category name"
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="parentCategory"
                                        render={({ field }) => (
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
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category Status</FormLabel>
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
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center space-x-4 pt-6">
                    <CancelButton />
                    <Separator orientation="vertical" className="h-8" />
                    <SubmitButton
                        isPending={isPending}
                        label={item ? "Update category" : "Create category"}
                    />
                </div>
            </form>
        </Form>
    );
};

export default CategoryForm;